import type { CaseHistoryItem, ProfileDraft } from './healthData';

const HOUSEHOLD_STORAGE_KEY = 'symptom_household_profiles_v1';

export interface HouseholdProfileRecord {
  id: string;
  label: string;
  relationship: string;
  updatedAt: string;
  profile: ProfileDraft;
}

export interface ProfileChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

export interface ProfileCompletionGuide {
  progress: number;
  completedCount: number;
  totalCount: number;
  checklist: ProfileChecklistItem[];
  nextFocus: string[];
}

export interface HealthTimelineEntry {
  id: string;
  title: string;
  summary: string;
  meta: string;
  statusLabel: string;
  tone: 'green' | 'yellow' | 'orange' | 'red' | 'slate';
  departments: string[];
}

export interface HealthDigest {
  title: string;
  summary: string;
  highlights: string[];
  rangeLabel: string;
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
}

function formatDateLabel(isoString: string) {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return '刚刚';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countFilled(values: Array<string | number | null | undefined>) {
  return values.filter(Boolean).length;
}

function pickMostCommon(values: string[]): string | null {
  if (values.length === 0) return null;

  const counter = new Map<string, number>();
  values.forEach((value) => {
    counter.set(value, (counter.get(value) ?? 0) + 1);
  });

  return Array.from(counter.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function readHouseholdProfiles(): HouseholdProfileRecord[] {
  return readLocalJson<HouseholdProfileRecord[]>(HOUSEHOLD_STORAGE_KEY, []).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export function upsertHouseholdProfile(input: {
  id?: string;
  label: string;
  relationship: string;
  profile: ProfileDraft;
}): HouseholdProfileRecord[] {
  const nextRecord: HouseholdProfileRecord = {
    id: input.id ?? `household-${Date.now()}`,
    label: input.label.trim() || input.profile.displayName.trim() || '家人档案',
    relationship: input.relationship.trim() || '家人',
    updatedAt: new Date().toISOString(),
    profile: {
      ...input.profile,
      profileMode: 'custom',
    },
  };

  const nextRecords = [
    nextRecord,
    ...readHouseholdProfiles().filter((record) => record.id !== nextRecord.id),
  ].slice(0, 8);

  writeLocalJson(HOUSEHOLD_STORAGE_KEY, nextRecords);
  return nextRecords;
}

export function removeHouseholdProfile(id: string): HouseholdProfileRecord[] {
  const nextRecords = readHouseholdProfiles().filter((record) => record.id !== id);
  writeLocalJson(HOUSEHOLD_STORAGE_KEY, nextRecords);
  return nextRecords;
}

export function buildProfileCompletionGuide(profile: ProfileDraft): ProfileCompletionGuide {
  const checklist: ProfileChecklistItem[] = [
    {
      id: 'identity',
      label: '补齐昵称、年龄与性别',
      description: '这些信息决定追问语气和风险提示会不会偏差太大。',
      completed: countFilled([profile.displayName, profile.birthYear, profile.gender]) >= 2,
    },
    {
      id: 'city',
      label: '补齐常住城市与关注重点',
      description: '可以让健康地图、线下建议和快捷入口更贴近你当前所在场景。',
      completed: Boolean(profile.city && profile.city !== '中国大陆' && profile.careFocus),
    },
    {
      id: 'history',
      label: '补齐慢病和过敏史',
      description: '这是减少重复追问、保守判断风险与用药提醒的关键。',
      completed: Boolean(profile.chronicConditions || profile.allergies),
    },
    {
      id: 'medications',
      label: '补齐当前用药',
      description: '这样系统才能避免推荐和现用药冲突的 OTC / 家庭处理方向。',
      completed: Boolean(profile.currentMedications),
    },
    {
      id: 'notes',
      label: '补充近期备注',
      description: '例如睡眠、家中老人儿童、近期体检异常或你最担心的点。',
      completed: Boolean(profile.medicalNotes),
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  return {
    progress: Math.round((completedCount / checklist.length) * 100),
    completedCount,
    totalCount: checklist.length,
    nextFocus: checklist.filter((item) => !item.completed).map((item) => item.label).slice(0, 3),
    checklist,
  };
}

export function buildHealthTimeline(recentCases: CaseHistoryItem[]): HealthTimelineEntry[] {
  return recentCases.slice(0, 6).map((item) => {
    const tone =
      item.triageLevel === 'red' || item.triageLevel === 'orange'
        ? item.triageLevel
        : item.triageLevel === 'yellow'
          ? 'yellow'
          : item.triageLevel === 'green'
            ? 'green'
            : 'slate';

    const sourceLabel = item.source === 'supabase' ? '云端记录' : '本机记录';
    const statusLabel = item.status === 'active' ? '仍可继续补充' : '已形成摘要';

    return {
      id: item.id,
      title: item.chiefComplaint,
      summary: normalizeText(item.assistantPreview) || '可继续回到原问诊补充新的症状变化。',
      meta: `${formatDateLabel(item.createdAt)} · ${sourceLabel}`,
      statusLabel,
      tone,
      departments: item.departments,
    };
  });
}

export function buildHealthDigest(
  recentCases: CaseHistoryItem[],
  range: 'week' | 'month'
): HealthDigest {
  const now = Date.now();
  const rangeDays = range === 'week' ? 7 : 30;
  const rangeLabel = range === 'week' ? '近 7 天' : '近 30 天';
  const windowStart = now - rangeDays * 24 * 60 * 60 * 1000;
  const rangeCases = recentCases.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return !Number.isNaN(createdAt) && createdAt >= windowStart;
  });

  if (rangeCases.length === 0) {
    return {
      title: `${rangeLabel}健康摘要`,
      summary: `${rangeLabel}还没有新的问诊记录，完成一次问诊后，这里会自动生成可分享的健康摘要。`,
      highlights: ['完成一次问诊后自动更新', '适合每周回看变化', '可用于导出或分享'],
      rangeLabel,
    };
  }

  const highRiskCount = rangeCases.filter(
    (item) => item.triageLevel === 'orange' || item.triageLevel === 'red'
  ).length;
  const topComplaint = pickMostCommon(rangeCases.map((item) => item.chiefComplaint));
  const topDepartment = pickMostCommon(rangeCases.flatMap((item) => item.departments));
  const latestCase = rangeCases[0];

  return {
    title: `${rangeLabel}健康摘要`,
    summary: `${rangeLabel}共记录 ${rangeCases.length} 次问诊${
      highRiskCount > 0 ? `，其中 ${highRiskCount} 次属于较高风险提醒` : '，目前以居家观察和尽快就医建议为主'
    }。`,
    highlights: [
      topComplaint ? `最常见主诉：${topComplaint}` : '最常见主诉：等待更多记录',
      topDepartment ? `最常出现科室：${topDepartment}` : '最常出现科室：等待更多记录',
      latestCase ? `最近一次记录：${formatDateLabel(latestCase.createdAt)}` : '最近一次记录：暂无',
    ],
    rangeLabel,
  };
}

export function buildNearbyPharmacyUrl(city?: string | null): string {
  const normalizedCity = city?.trim() && city !== '中国大陆' ? city.trim() : '';
  const keyword = normalizedCity ? `${normalizedCity} 附近药房` : '附近药房';
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(
    keyword
  )}&src=symptom-checker&coordinate=gaode&callnative=1`;
}

export function buildWorkspaceShareText(params: {
  profile: ProfileDraft;
  recentCases: CaseHistoryItem[];
  householdCount: number;
}) {
  const completionGuide = buildProfileCompletionGuide(params.profile);
  const latestCase = params.recentCases[0];
  const lines = [
    '健康助手 · 个人健康摘要',
    params.profile.displayName ? `当前档案：${params.profile.displayName}` : '当前档案：未命名',
    params.profile.city && params.profile.city !== '中国大陆' ? `常住城市：${params.profile.city}` : '',
    `档案完整度：${completionGuide.progress}%`,
    latestCase ? `最近记录：${latestCase.chiefComplaint}（${formatDateLabel(latestCase.createdAt)}）` : '最近记录：暂无',
    params.householdCount > 0 ? `家庭档案：已保存 ${params.householdCount} 份` : '家庭档案：暂未保存',
    '本摘要仅用于分享近期情况，不构成医疗诊断。',
  ].filter(Boolean);

  return lines.join('\n');
}

