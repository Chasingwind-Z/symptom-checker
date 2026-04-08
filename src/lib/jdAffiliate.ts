/** JD (京东) affiliate link utilities for medication purchase referrals. */

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