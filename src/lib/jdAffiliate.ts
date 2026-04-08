/** JD (京东) affiliate link utilities for medication purchase referrals. */

/** Maps symptom categories to JD search keywords for broadening product discovery. */
export const MEDICATION_CATEGORIES: Record<string, string[]> = {
  '感冒': ['感冒药 OTC', '维生素C', '口罩 医用', '体温计'],
  '腹泻': ['电解质水', '蒙脱石散', '益生菌'],
  '过敏': ['氯雷他定', '炉甘石洗剂', '防过敏口罩'],
  '头痛': ['布洛芬', '对乙酰氨基酚', '冰敷贴'],
  '肌肉酸痛': ['止痛贴', '云南白药喷雾', '冰敷袋'],
};

const JD_SEARCH_BASE = 'https://search.jd.com/Search';
const JD_MOBILE_BASE = 'https://so.m.jd.com/ware/search.action';
const STORAGE_KEY = 'jd_affiliate_clicks';

interface ClickRecord {
  medicationName: string;
  timestamp: string;
  source: string;
  diagnosisLevel?: string;
}

function getUnionId(): string | undefined {
  const id = import.meta.env.VITE_JD_UNION_ID;
  return typeof id === 'string' && id.trim() ? id.trim() : undefined;
}

/** Build a JD desktop search URL for the given medication keyword. */
export function buildJDSearchUrl(keyword: string): string {
  const params = new URLSearchParams({
    keyword: `${keyword} OTC`,
    enc: 'utf-8',
  });
  const unionId = getUnionId();
  if (unionId) params.set('union_id', unionId);
  return `${JD_SEARCH_BASE}?${params.toString()}`;
}

/** Build a JD mobile deep-link search URL. */
export function buildJDDeepLink(keyword: string): string {
  const params = new URLSearchParams({
    keyword: `${keyword} OTC`,
  });
  const unionId = getUnionId();
  if (unionId) params.set('union_id', unionId);
  return `${JD_MOBILE_BASE}?${params.toString()}`;
}

/** Persist a click event to localStorage for analytics / future sync. */
export function trackMedicationClick(data: {
  medicationName: string;
  diagnosisLevel?: string;
  source: string;
}): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history: ClickRecord[] = raw ? (JSON.parse(raw) as ClickRecord[]) : [];
    history.push({
      medicationName: data.medicationName,
      timestamp: new Date().toISOString(),
      source: data.source,
      diagnosisLevel: data.diagnosisLevel,
    });
    // Keep last 200 records to avoid unbounded growth
    const trimmed = history.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage may be unavailable (private browsing, quota, etc.)
  }
}

/** Return recent click records (newest first). */
export function getRecentClicks(): ClickRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const history = JSON.parse(raw) as ClickRecord[];
    return [...history].reverse();
  } catch {
    return [];
  }
}