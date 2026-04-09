import type { ConversationSession, DiagnosisResult, Message } from '../types';
import { getSupabaseBootstrapStatus, getSupabaseClient, maskEmail } from './supabase';
import { buildCombinedMedicalNotes, getDemoPersonaWorkspace } from './personalization';

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
  caseId?: string;
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

function extractSuggestions(content: string): string[] | undefined {
  const match = content.match(/\{"suggestions":\s*(\[[\s\S]*?\])\}/);
  if (!match) return undefined;

  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeStoredTimestamp(value: string | null | undefined, fallback?: string) {
  if (!value) return fallback ? new Date(fallback) : new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? (fallback ? new Date(fallback) : new Date()) : parsed;
}

function normalizeStoredAttachments(raw: unknown): Message['attachments'] {
  if (!Array.isArray(raw)) return undefined;

  const attachments = raw
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const attachment = item as {
        id?: unknown;
        kind?: unknown;
        name?: unknown;
        mimeType?: unknown;
        sizeBytes?: unknown;
      };

      return {
        id: typeof attachment.id === 'string' ? attachment.id : `cloud-attachment-${index}`,
        kind: attachment.kind === 'image' ? 'image' : 'image',
        name: typeof attachment.name === 'string' ? attachment.name : `图片 ${index + 1}`,
        mimeType: typeof attachment.mimeType === 'string' ? attachment.mimeType : 'image/jpeg',
        sizeBytes: typeof attachment.sizeBytes === 'number' ? attachment.sizeBytes : 0,
      } as const;
    })
    .filter((item): item is NonNullable<Message['attachments']>[number] => Boolean(item));

  return attachments.length > 0 ? attachments : undefined;
}

function buildConversationDiagnosis(caseRow: {
  triage_level: DiagnosisResult['level'] | null;
  triage_reason: string | null;
  recommendation: string | null;
  structured_summary: unknown;
}): DiagnosisResult | null {
  if (!caseRow.triage_level || !caseRow.triage_reason || !caseRow.recommendation) {
    return null;
  }

  const structuredSummary =
    caseRow.structured_summary && typeof caseRow.structured_summary === 'object'
      ? caseRow.structured_summary
      : {};
  const departments = Array.isArray((structuredSummary as { departments?: unknown }).departments)
    ? ((structuredSummary as { departments?: string[] }).departments ?? []).filter(Boolean)
    : [];
  const disclaimer =
    typeof (structuredSummary as { disclaimer?: unknown }).disclaimer === 'string'
      ? ((structuredSummary as { disclaimer?: string }).disclaimer ?? '')
      : '本建议仅供参考，不构成医疗诊断';

  return {
    level: caseRow.triage_level,
    reason: caseRow.triage_reason,
    action: caseRow.recommendation,
    departments,
    disclaimer,
  };
}

export async function loadCloudConversationSessions(limit = 12): Promise<ConversationSession[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const dataClient = client;
  const { data: cases, error: casesError } = await dataClient
    .from('cases')
    .select(
      'id, chief_complaint, triage_level, triage_reason, recommendation, structured_summary, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (casesError || !cases || cases.length === 0) {
    if (casesError && import.meta.env.DEV) {
      console.warn('[Supabase] 读取云端会话线程失败：', casesError.message);
    }
    return [];
  }

  const caseIds = cases.map((item) => item.id);
  const { data: messageRows, error: messageError } = await dataClient
    .from('case_messages')
    .select('case_id, role, content, sequence_no, metadata, created_at')
    .in('case_id', caseIds)
    .order('sequence_no', { ascending: true });

  if (messageError && import.meta.env.DEV) {
    console.warn('[Supabase] 读取云端会话详情失败：', messageError.message);
  }

  const messagesByCaseId = new Map<string, Message[]>();

  (messageRows ?? []).forEach((row) => {
    if (row.role !== 'user' && row.role !== 'assistant') {
      return;
    }

    const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    const timestamp =
      typeof (metadata as { timestamp?: unknown }).timestamp === 'string'
        ? ((metadata as { timestamp?: string }).timestamp ?? row.created_at)
        : row.created_at;
    const attachments = normalizeStoredAttachments((metadata as { attachments?: unknown }).attachments);

    const nextMessage: Message = {
      id: `${row.case_id}-${row.sequence_no}`,
      role: row.role,
      content: row.content,
      timestamp: normalizeStoredTimestamp(timestamp, row.created_at),
      attachments,
      suggestions: row.role === 'assistant' ? extractSuggestions(row.content) : undefined,
    };

    const existing = messagesByCaseId.get(row.case_id) ?? [];
    messagesByCaseId.set(row.case_id, [...existing, nextMessage]);
  });

  return cases
    .map<ConversationSession | null>((item) => {
      const messages = messagesByCaseId.get(item.id) ?? [];
      if (messages.length === 0) return null;

      return {
        id: item.id,
        title: toPreview(item.chief_complaint, '云端问诊'),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        riskLevel:
          item.triage_level === 'green' ||
          item.triage_level === 'yellow' ||
          item.triage_level === 'orange' ||
          item.triage_level === 'red'
            ? item.triage_level
            : null,
        diagnosisResult: buildConversationDiagnosis(item),
        messages,
        storage: 'supabase' as const,
      } satisfies ConversationSession;
    })
    .filter((item): item is ConversationSession => item !== null)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
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

function toPreview(text: string, fallback: string) {
  const stripped = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, 48) || fallback;
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

function removeLocalCaseHistory(caseId: string) {
  const nextCases = readLocalCaseHistory().filter((item) => item.id !== caseId);
  writeLocalJson(CASE_HISTORY_STORAGE_KEY, nextCases);
  return nextCases;
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
    if (import.meta.env.DEV) {
      console.warn('[Supabase] 档案同步失败：', error.message);
    }
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
      statusLabel: '场景资料未找到',
      helperText: '请稍后重试或选择其他常见场景。',
    };
  }

  writeLocalJson(PROFILE_DRAFT_STORAGE_KEY, demoWorkspace.profile);
  writeLocalJson(CASE_HISTORY_STORAGE_KEY, demoWorkspace.recentCases);

  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_DEMO_SEED_KEY, 'done');
  }

  return {
    ok: true,
    statusLabel: `已切换到常见场景：${demoWorkspace.label}`,
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
  const casePayload = {
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
  };

  const caseMutation = input.caseId
    ? dataClient
        .from('cases')
        .update(casePayload)
        .eq('id', input.caseId)
        .eq('user_id', user.id)
    : dataClient.from('cases').insert(casePayload);

  const { data: caseRow, error: caseError } = await caseMutation
    .select('id, chief_complaint, triage_level, status, created_at')
    .single();

  if (caseError || !caseRow) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] 病例写入失败，已保留本机缓存：', caseError?.message);
    }
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
    if (input.caseId) {
      const { error: deleteMessageError } = await dataClient
        .from('case_messages')
        .delete()
        .eq('case_id', input.caseId);

      if (deleteMessageError && import.meta.env.DEV) {
        console.warn('[Supabase] 覆盖云端会话详情失败：', deleteMessageError.message);
      }
    }

    const { error: messageError } = await dataClient.from('case_messages').insert(messageRows);
    if (messageError) {
      if (import.meta.env.DEV) {
        console.warn('[Supabase] 对话详情写入失败：', messageError.message);
      }
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

export async function deleteCaseHistoryItem(caseId: string) {
  const localCases = readLocalCaseHistory()
  const target = localCases.find((item) => item.id === caseId) ?? null
  const hadLocalCopy = Boolean(target)

  if (hadLocalCopy) {
    removeLocalCaseHistory(caseId)
  }

  const shouldDeleteRemote = target?.source === 'supabase' || !caseId.startsWith('local-')
  if (!shouldDeleteRemote) {
    return {
      caseId,
      deletedFrom: 'local' as const,
      deletedLocal: hadLocalCopy,
      deletedRemote: false,
    }
  }

  const client = getSupabaseClient()
  if (!client) {
    return {
      caseId,
      deletedFrom: 'local' as const,
      deletedLocal: hadLocalCopy,
      deletedRemote: false,
    }
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser()

  if (authError || !user) {
    return {
      caseId,
      deletedFrom: 'local' as const,
      deletedLocal: hadLocalCopy,
      deletedRemote: false,
      error: authError?.message,
    }
  }

  const dataClient = client
  const { error: messageError } = await dataClient.from('case_messages').delete().eq('case_id', caseId)
  if (messageError && import.meta.env.DEV) {
    console.warn('[Supabase] 删除对话详情失败：', messageError.message)
  }

  const { error: caseError } = await dataClient
    .from('cases')
    .delete()
    .eq('id', caseId)
    .eq('user_id', user.id)

  if (caseError) {
    if (import.meta.env.DEV) {
      console.warn('[Supabase] 删除问诊摘要失败：', caseError.message)
    }

    return {
      caseId,
      deletedFrom: 'local' as const,
      deletedLocal: hadLocalCopy,
      deletedRemote: false,
      error: caseError.message,
    }
  }

  return {
    caseId,
    deletedFrom: 'supabase' as const,
    deletedLocal: hadLocalCopy,
    deletedRemote: true,
  }
}

export async function loadHealthWorkspace(limit = 5): Promise<HealthWorkspaceSnapshot> {
  const bootstrap = getSupabaseBootstrapStatus();
  const localProfile = readLocalProfileDraft();
  const localCases = readLocalCaseHistory().slice(0, limit);
  const client = getSupabaseClient();

  if (!client) {
    return {
      mode: bootstrap.state === 'error' ? 'error' : 'local',
      statusLabel:
        localProfile.profileMode === 'demo' ? '当前使用参考资料模板' : bootstrap.label,
      helperText:
        localProfile.profileMode === 'demo'
          ? '你可以直接继续问诊，也可以先把这份资料改成自己的真实情况后再保存。'
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
    if (import.meta.env.DEV) {
      console.warn('[Supabase] 读取云端会话失败，已回退到本机缓存：', authError.message);
    }

    return {
      mode: bootstrap.state === 'error' ? 'error' : 'cloud-ready',
      statusLabel: bootstrap.state === 'error' ? '邮箱同步暂不可用' : '登录后可继续同步',
      helperText:
        bootstrap.state === 'error'
          ? '暂时无法读取已同步资料，当前会继续保存在本设备中。'
          : '游客模式 · 数据保存在本设备',
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
          ? '参考资料模板待确认（登录后可同步）'
          : '未登录 · 可开启同步',
      helperText:
        localProfile.profileMode === 'demo'
          ? '当前是一份可编辑的资料模板；建议先改成自己的真实资料后再开启同步。'
          : '你可以先继续使用；输入邮箱后，我们会用登录链接帮你同步资料和历史问诊。',
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

  const hasSyncFallback = Boolean(profileResponse.error || caseResponse.error);

  if (import.meta.env.DEV) {
    if (profileResponse.error) {
      console.warn('[Supabase] 读取云端档案失败，已回退到本机缓存：', profileResponse.error.message);
    }
    if (caseResponse.error) {
      console.warn('[Supabase] 读取云端问诊摘要失败，已回退到本机缓存：', caseResponse.error.message);
    }
  }

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
    statusLabel: user.email ? `已登录 · ${maskEmail(user.email)}` : '已登录',
    helperText:
      hasSyncFallback
        ? '这次已同步资料加载不完整；已先回退到本设备缓存，稍后可刷新重试。'
        : recentCases.length > 0
        ? `已同步 ${recentCases.length} 条最近问诊，可跨设备继续查看资料与历史问诊。`
        : '云端账号已连接，新的资料修改和问诊结果会自动尝试同步。',
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

const REPORT_RECORDS_KEY = 'health_report_records';

export interface ReportRecord {
  id: string;
  analyzedAt: string;
  reportType: string;
  summary: string;
  abnormalItems: string[];
}

export function saveReportRecord(record: ReportRecord): void {
  try {
    const raw = localStorage.getItem(REPORT_RECORDS_KEY);
    const records: ReportRecord[] = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem(REPORT_RECORDS_KEY, JSON.stringify(records.slice(-50)));
  } catch { /* ignore storage errors */ }
}

export function getReportRecords(): ReportRecord[] {
  try {
    const raw = localStorage.getItem(REPORT_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
