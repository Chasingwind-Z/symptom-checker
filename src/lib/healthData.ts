import type { DiagnosisResult, Message } from '../types';
import { getSupabaseBootstrapStatus, getSupabaseClient } from './supabase';
import {
  buildCombinedMedicalNotes,
  getDefaultDemoPersonaWorkspace,
  getDemoPersonaWorkspace,
} from './personalization';

const PROFILE_DRAFT_STORAGE_KEY = 'symptom_profile_draft_v1';
const CASE_HISTORY_STORAGE_KEY = 'symptom_case_history_v1';
const WORKSPACE_UPDATED_EVENT = 'symptom-workspace-updated';
const GUEST_DEMO_SEED_KEY = 'symptom_guest_demo_seeded_v1';

export interface ProfileDraft {
  displayName: string;
  city: string;
  birthYear: number | null;
  gender: string;
  medicalNotes: string;
  chronicConditions: string;
  allergies: string;
  currentMedications: string;
  careFocus: string;
  profileMode: 'custom' | 'demo';
}

export interface CaseHistoryItem {
  id: string;
  createdAt: string;
  chiefComplaint: string;
  triageLevel: DiagnosisResult['level'] | 'pending';
  status: 'active' | 'closed' | 'archived';
  assistantPreview: string;
  departments: string[];
  source: 'local' | 'supabase';
}

export interface PersistCaseRecordInput {
  diagnosis: DiagnosisResult | null;
  messages: Message[];
}

export interface HealthWorkspaceSnapshot {
  mode: 'local' | 'cloud-ready' | 'cloud-session' | 'error';
  statusLabel: string;
  helperText: string;
  profile: ProfileDraft;
  recentCases: CaseHistoryItem[];
  sessionEmail: string | null;
}

const DEFAULT_PROFILE_DRAFT: ProfileDraft = {
  displayName: '',
  city: '中国大陆',
  birthYear: null,
  gender: '',
  medicalNotes: '',
  chronicConditions: '',
  allergies: '',
  currentMedications: '',
  careFocus: '',
  profileMode: 'custom',
};

function dispatchWorkspaceUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WORKSPACE_UPDATED_EVENT));
}

function readLocalJson<T>(storageKey: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(storageKey: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(value));
  dispatchWorkspaceUpdated();
}

function isProfileEffectivelyEmpty(profile: ProfileDraft): boolean {
  return ![
    profile.displayName,
    profile.birthYear,
    profile.gender,
    profile.medicalNotes,
    profile.chronicConditions,
    profile.allergies,
    profile.currentMedications,
    profile.careFocus,
  ].some(Boolean);
}

function ensureGuestDemoSeeded() {
  if (typeof window === 'undefined') return false;

  const currentProfile = readLocalJson<ProfileDraft>(PROFILE_DRAFT_STORAGE_KEY, DEFAULT_PROFILE_DRAFT);
  const currentCases = readLocalJson<CaseHistoryItem[]>(CASE_HISTORY_STORAGE_KEY, []);
  const alreadySeeded = localStorage.getItem(GUEST_DEMO_SEED_KEY) === 'done';

  if (alreadySeeded || !isProfileEffectivelyEmpty(currentProfile) || currentCases.length > 0) {
    return false;
  }

  const demoWorkspace = getDefaultDemoPersonaWorkspace();
  if (!demoWorkspace) return false;

  writeLocalJson(PROFILE_DRAFT_STORAGE_KEY, demoWorkspace.profile);
  writeLocalJson(CASE_HISTORY_STORAGE_KEY, demoWorkspace.recentCases);
  localStorage.setItem(GUEST_DEMO_SEED_KEY, 'done');
  return true;
}

function toPreview(text: string, fallback: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.slice(0, 48) || fallback;
}

function normalizeTriageLevel(value: DiagnosisResult['level'] | null | undefined): CaseHistoryItem['triageLevel'] {
  return value === 'green' || value === 'yellow' || value === 'orange' || value === 'red'
    ? value
    : 'pending';
}

function buildLocalCaseHistoryItem(input: PersistCaseRecordInput): CaseHistoryItem {
  const firstUserMessage =
    input.messages.find((message) => message.role === 'user')?.content ??
    input.diagnosis?.reason ??
    '未命名问诊';
  const lastAssistantMessage =
    [...input.messages].reverse().find((message) => message.role === 'assistant')?.content ??
    input.diagnosis?.action ??
    '待补充建议';

  return {
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    chiefComplaint: toPreview(firstUserMessage, '未命名问诊'),
    triageLevel: input.diagnosis?.level ?? 'pending',
    status: input.diagnosis ? 'closed' : 'active',
    assistantPreview: toPreview(lastAssistantMessage, '待补充建议'),
    departments: input.diagnosis?.departments ?? [],
    source: 'local',
  };
}

function cacheCaseHistory(item: CaseHistoryItem) {
  const nextCases = [
    item,
    ...readLocalCaseHistory().filter((existing) => existing.id !== item.id),
  ].slice(0, 12);

  writeLocalJson(CASE_HISTORY_STORAGE_KEY, nextCases);
}

export function getDefaultProfileDraft(): ProfileDraft {
  return { ...DEFAULT_PROFILE_DRAFT };
}

export function readLocalProfileDraft(): ProfileDraft {
  return {
    ...DEFAULT_PROFILE_DRAFT,
    ...readLocalJson<Partial<ProfileDraft>>(PROFILE_DRAFT_STORAGE_KEY, DEFAULT_PROFILE_DRAFT),
  };
}

export function readLocalCaseHistory(): CaseHistoryItem[] {
  return readLocalJson<CaseHistoryItem[]>(CASE_HISTORY_STORAGE_KEY, []);
}

export async function saveProfileDraft(draft: ProfileDraft) {
  const normalizedDraft: ProfileDraft = {
    ...DEFAULT_PROFILE_DRAFT,
    ...draft,
    profileMode: draft.profileMode ?? 'custom',
  };
  writeLocalJson(PROFILE_DRAFT_STORAGE_KEY, normalizedDraft);

  const client = getSupabaseClient();
  if (!client) {
    return {
      storedIn: 'local' as const,
      statusLabel: '游客档案已保存',
      helperText: '当前先保存在这个浏览器里；登录后可自动同步到你的个人空间。',
    };
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return {
      storedIn: 'local' as const,
      statusLabel: '资料已保存在当前浏览器',
      helperText: '基础资料已先本地保存，使用邮箱登录后会自动同步到云端。',
    };
  }

  const medicalNotes = buildCombinedMedicalNotes(normalizedDraft);

  const dataClient = client;
  const { error } = await dataClient.from('profiles').upsert(
    {
      id: user.id,
      display_name: normalizedDraft.displayName || null,
      city: normalizedDraft.city || null,
      birth_year: normalizedDraft.birthYear,
      gender: normalizedDraft.gender || null,
      medical_notes: medicalNotes || null,
      locale: 'zh-CN',
      preferred_language: 'zh-CN',
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.warn('[Supabase] 档案同步失败：', error.message);
    return {
      storedIn: 'local' as const,
      statusLabel: '云端同步待重试',
      helperText: '这次没有成功同步，但浏览器本地记录已保留，稍后重试即可。',
    };
  }

  return {
    storedIn: 'supabase' as const,
    statusLabel: '档案已同步到云端',
    helperText: '下次登录同一邮箱时，可继续查看这份资料与最近问诊记录。',
  };
}

export async function applyDemoPersona(personaId: string) {
  const demoWorkspace = getDemoPersonaWorkspace(personaId);
  if (!demoWorkspace) {
    return {
      ok: false,
      statusLabel: '体验档案未找到',
      helperText: '请稍后重试或选择其他体验画像。',
    };
  }

  writeLocalJson(PROFILE_DRAFT_STORAGE_KEY, demoWorkspace.profile);
  writeLocalJson(CASE_HISTORY_STORAGE_KEY, demoWorkspace.recentCases);

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_DEMO_SEED_KEY, 'done');
  }

  return {
    ok: true,
    statusLabel: `已切换到体验画像：${demoWorkspace.label}`,
    helperText: '你可以直接继续问诊，也可以把这份资料改成自己的真实情况后再保存。',
  };
}

export async function persistCaseRecord(input: PersistCaseRecordInput) {
  const localItem = buildLocalCaseHistoryItem(input);
  cacheCaseHistory(localItem);

  const client = getSupabaseClient();
  if (!client) {
    return {
      storedIn: 'local' as const,
      caseId: localItem.id,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return {
      storedIn: 'local' as const,
      caseId: localItem.id,
      error: authError?.message,
    };
  }

  const dataClient = client;
  const { data: caseRow, error: caseError } = await dataClient
    .from('cases')
    .insert({
      user_id: user.id,
      profile_id: null,
      status: input.diagnosis ? 'closed' : 'active',
      channel: 'web',
      is_anonymous: false,
      chief_complaint: localItem.chiefComplaint,
      triage_level: input.diagnosis?.level ?? null,
      triage_reason: input.diagnosis?.reason ?? null,
      recommendation: input.diagnosis?.action ?? null,
      structured_summary: {
        departments: input.diagnosis?.departments ?? [],
        disclaimer: input.diagnosis?.disclaimer ?? null,
      },
      location_context: {},
    })
    .select('id, chief_complaint, triage_level, status, created_at')
    .single();

  if (caseError || !caseRow) {
    console.warn('[Supabase] 病例写入失败，已保留本机缓存：', caseError?.message);
    return {
      storedIn: 'local' as const,
      caseId: localItem.id,
      error: caseError?.message,
    };
  }

  const messageRows = input.messages.map((message, index) => ({
    case_id: caseRow.id,
    role: message.role,
    content: message.content,
    sequence_no: index + 1,
    metadata: {
      timestamp:
        message.timestamp instanceof Date
          ? message.timestamp.toISOString()
          : new Date(message.timestamp).toISOString(),
      attachments:
        message.attachments?.map((attachment) => ({
          id: attachment.id,
          kind: attachment.kind,
          name: attachment.name,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
        })) ?? [],
    },
  }));

  if (messageRows.length > 0) {
    const { error: messageError } = await dataClient.from('case_messages').insert(messageRows);
    if (messageError) {
      console.warn('[Supabase] 对话详情写入失败：', messageError.message);
    }
  }

  cacheCaseHistory({
    ...localItem,
    id: caseRow.id,
    createdAt: caseRow.created_at,
    triageLevel: normalizeTriageLevel(caseRow.triage_level),
    status: caseRow.status,
    source: 'supabase',
  });

  return {
    storedIn: 'supabase' as const,
    caseId: caseRow.id,
  };
}

export async function loadHealthWorkspace(limit = 5): Promise<HealthWorkspaceSnapshot> {
  const seededDemo = ensureGuestDemoSeeded();
  const bootstrap = getSupabaseBootstrapStatus();
  const localProfile = readLocalProfileDraft();
  const localCases = readLocalCaseHistory().slice(0, limit);
  const client = getSupabaseClient();

  if (!client) {
    return {
      mode: bootstrap.state === 'error' ? 'error' : 'local',
      statusLabel:
        localProfile.profileMode === 'demo' && seededDemo
          ? '已载入体验画像（游客模式）'
          : bootstrap.label,
      helperText:
        localProfile.profileMode === 'demo'
          ? '已为你预置一份可编辑的体验档案与示例问诊记录，用来展示个性化推荐效果。'
          : bootstrap.helperText,
      profile: localProfile,
      recentCases: localCases,
      sessionEmail: null,
    };
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError) {
    return {
      mode: bootstrap.state === 'error' ? 'error' : 'cloud-ready',
      statusLabel: bootstrap.state === 'error' ? '云端同步暂不可用' : '游客模式（登录后可同步）',
      helperText:
        bootstrap.state === 'error'
          ? '暂时无法读取云端会话，当前会继续保存在浏览器中。'
          : '还没有读取到有效登录态，你可以重新发送邮箱登录链接继续同步。',
      profile: localProfile,
      recentCases: localCases,
      sessionEmail: null,
    };
  }

  if (!user) {
    return {
      mode: 'cloud-ready',
      statusLabel:
        localProfile.profileMode === 'demo'
          ? '游客模式（可登录后同步这份体验档案）'
          : '游客模式（登录后可同步档案）',
      helperText:
        localProfile.profileMode === 'demo'
          ? '当前已经带上一份可编辑体验画像；登录后可继续保留或改成自己的资料再同步。'
          : '你可以先以游客方式使用；登录后档案和历史会话会自动跟随邮箱账号同步。',
      profile: localProfile,
      recentCases: localCases,
      sessionEmail: null,
    };
  }

  const dataClient = client;
  const [profileResponse, caseResponse] = await Promise.all([
    dataClient
      .from('profiles')
      .select('display_name, city, birth_year, gender, medical_notes')
      .eq('id', user.id)
      .maybeSingle(),
    dataClient
      .from('cases')
      .select('id, chief_complaint, triage_level, status, created_at, recommendation, structured_summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const syncedProfile = profileResponse.data
    ? {
        displayName: profileResponse.data.display_name ?? localProfile.displayName,
        city: profileResponse.data.city ?? localProfile.city,
        birthYear: profileResponse.data.birth_year ?? localProfile.birthYear,
        gender: profileResponse.data.gender ?? localProfile.gender,
        medicalNotes: profileResponse.data.medical_notes ?? localProfile.medicalNotes,
        chronicConditions: localProfile.chronicConditions,
        allergies: localProfile.allergies,
        currentMedications: localProfile.currentMedications,
        careFocus: localProfile.careFocus,
        profileMode: localProfile.profileMode,
      }
    : localProfile;

  const recentCases: CaseHistoryItem[] =
    caseResponse.data?.map((item: {
      id: string;
      created_at: string;
      chief_complaint: string;
      triage_level: DiagnosisResult['level'] | null;
      status: CaseHistoryItem['status'];
      recommendation: string | null;
      structured_summary?: unknown;
    }) => {
      const structuredSummary =
        item.structured_summary && typeof item.structured_summary === 'object'
          ? item.structured_summary
          : {};
      const departments = Array.isArray((structuredSummary as { departments?: unknown }).departments)
        ? ((structuredSummary as { departments?: string[] }).departments ?? [])
        : [];

      return {
        id: item.id,
        createdAt: item.created_at,
        chiefComplaint: item.chief_complaint,
        triageLevel: normalizeTriageLevel(item.triage_level),
        status: item.status,
        assistantPreview:
          typeof item.recommendation === 'string' && item.recommendation.trim()
            ? toPreview(item.recommendation, '待补充建议')
            : '待补充建议',
        departments,
        source: 'supabase' as const,
      };
    }) ?? localCases;

  return {
    mode: 'cloud-session',
    statusLabel: user.email ? `已连接云端账号：${user.email}` : '已连接云端账号',
    helperText:
      recentCases.length > 0
        ? `已同步 ${recentCases.length} 条最近问诊，可跨设备继续查看档案与历史摘要。`
        : '云端账号已连接，新的档案修改和问诊结果会自动尝试同步。',
    profile: syncedProfile,
    recentCases,
    sessionEmail: user.email ?? null,
  };
}

export function subscribeHealthWorkspace(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(WORKSPACE_UPDATED_EVENT, callback);
  return () => window.removeEventListener(WORKSPACE_UPDATED_EVENT, callback);
}
