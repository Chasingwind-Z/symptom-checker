import type {
  DiagnosisResult,
  FollowUpRecord,
  FollowUpResponseOption,
  RiskLevel,
} from '../types';

const FOLLOW_UP_STORAGE_KEY = 'symptom_followup_cases';
const FOLLOW_UP_STORE_EVENT = 'symptom-followup-records-changed';
const MAX_FOLLOW_UP_RECORDS = 8;
const FOLLOW_UP_DISTRICTS = [
  '朝阳区',
  '海淀区',
  '东城区',
  '西城区',
  '丰台区',
  '石景山区',
  '通州区',
  '顺义区',
  '昌平区',
  '大兴区',
  '房山区',
  '门头沟区',
] as const;
const RISK_LEVELS: readonly RiskLevel[] = ['green', 'yellow', 'orange', 'red'];

type StoredFollowUpRecord = Omit<FollowUpRecord, 'status' | 'dueAt'>;

export const FOLLOW_UP_RESPONSE_OPTIONS = [
  '明显好转',
  '略有好转',
  '没有变化',
  '更严重了',
] as const;

function getFollowUpReminderDelayMs() {
  return import.meta.env.DEV ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && RISK_LEVELS.includes(value as RiskLevel);
}

export function isFollowUpResponseOption(value: unknown): value is FollowUpResponseOption {
  return (
    typeof value === 'string' &&
    FOLLOW_UP_RESPONSE_OPTIONS.includes(value as FollowUpResponseOption)
  );
}

function toFollowUpRecord(record: StoredFollowUpRecord): FollowUpRecord {
  return {
    ...record,
    status: record.response ? 'completed' : 'pending',
    dueAt: record.createdAt + getFollowUpReminderDelayMs(),
  };
}

function normalizeStoredFollowUpRecord(
  raw: unknown,
  index: number
): StoredFollowUpRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Partial<StoredFollowUpRecord>;
  if (typeof record.summary !== 'string' || record.summary.trim().length === 0) return null;
  if (!isRiskLevel(record.level)) return null;

  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
      ? record.createdAt
      : Date.now();
  const response = isFollowUpResponseOption(record.response) ? record.response : undefined;
  const respondedAt =
    response && typeof record.respondedAt === 'number' && Number.isFinite(record.respondedAt)
      ? record.respondedAt
      : response
        ? createdAt
        : undefined;

  return {
    id:
      typeof record.id === 'string' && record.id.trim().length > 0
        ? record.id
        : `followup-${createdAt}-${index}`,
    summary: record.summary.trim(),
    level: record.level,
    createdAt,
    district:
      typeof record.district === 'string' && record.district.trim().length > 0
        ? record.district
        : FOLLOW_UP_DISTRICTS[index % FOLLOW_UP_DISTRICTS.length],
    response,
    respondedAt,
  };
}

function readStoredFollowUpRecords(): StoredFollowUpRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeStoredFollowUpRecord)
      .filter((record): record is StoredFollowUpRecord => Boolean(record));
  } catch {
    return [];
  }
}

function writeStoredFollowUpRecords(records: StoredFollowUpRecord[]) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event(FOLLOW_UP_STORE_EVENT));
}

function createFollowUpRecord(userText: string, result: DiagnosisResult): StoredFollowUpRecord {
  const createdAt = Date.now();
  const summary = userText.replace(/\s+/g, '').slice(0, 18) || result.reason.slice(0, 18);
  const district =
    FOLLOW_UP_DISTRICTS[Math.floor(Math.random() * FOLLOW_UP_DISTRICTS.length)];

  return {
    id: `followup-${createdAt}`,
    summary,
    level: result.level,
    createdAt,
    district,
  };
}

function normalizeFollowUpSummaryKey(value: string) {
  return value.replace(/\s+/g, '').replace(/[^\w\u4e00-\u9fff]/g, '').toLowerCase()
}

export function subscribeToFollowUpRecords(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStoreChange = () => {
    listener();
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === FOLLOW_UP_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(FOLLOW_UP_STORE_EVENT, handleStoreChange);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(FOLLOW_UP_STORE_EVENT, handleStoreChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export function deleteFollowUpRecord(recordId: string): void {
  const records = readStoredFollowUpRecords().filter((r) => r.id !== recordId);
  writeStoredFollowUpRecords(records);
}

export function readFollowUpRecords(): FollowUpRecord[] {
  return readStoredFollowUpRecords().map(toFollowUpRecord);
}

export function queueFollowUpRecord(userText: string, result: DiagnosisResult) {
  const nextRecord = createFollowUpRecord(userText, result);
  const nextSummaryKey = normalizeFollowUpSummaryKey(nextRecord.summary)
  const existingRecords = readStoredFollowUpRecords().filter((record) => {
    if (record.id === nextRecord.id) return false

    const isSamePendingSummary =
      !record.response &&
      record.level === nextRecord.level &&
      normalizeFollowUpSummaryKey(record.summary) === nextSummaryKey

    return !isSamePendingSummary
  });
  writeStoredFollowUpRecords([nextRecord, ...existingRecords].slice(0, MAX_FOLLOW_UP_RECORDS));

  return toFollowUpRecord(nextRecord);
}

export function saveFollowUpRecordResponse(
  recordId: string,
  response: FollowUpResponseOption
): FollowUpRecord | null {
  let updatedRecord: StoredFollowUpRecord | null = null;
  const nextRecords = readStoredFollowUpRecords().map((record) => {
    if (record.id !== recordId) {
      return record;
    }

    const nextRecord: StoredFollowUpRecord = record.response
      ? record
      : {
          ...record,
          response,
          respondedAt: Date.now(),
        };
    updatedRecord = nextRecord;
    return nextRecord;
  });

  if (!updatedRecord) return null;

  writeStoredFollowUpRecords(nextRecords);
  return toFollowUpRecord(updatedRecord);
}

export function getPendingFollowUpRecords(records = readFollowUpRecords()) {
  return records.filter((record) => record.status === 'pending');
}

export function getCompletedFollowUpRecords(records = readFollowUpRecords()) {
  return records.filter((record) => record.status === 'completed');
}

export function getDueFollowUpRecord(records = readFollowUpRecords()) {
  const now = Date.now();
  return records.find((record) => record.status === 'pending' && now >= record.dueAt) ?? null;
}

// --- Follow-up Appointment Tracking ---

const APPOINTMENTS_KEY = 'follow_up_appointments';

export interface FollowUpAppointment {
  id: string;
  scheduledAt: string; // ISO date
  note: string;
  status: 'pending' | 'completed' | 'missed';
  originalSessionId?: string;
  createdAt: string;
}

export function saveAppointment(
  apt: Omit<FollowUpAppointment, 'id' | 'createdAt' | 'status'>
): FollowUpAppointment {
  const items = getAppointments();
  const newApt: FollowUpAppointment = {
    ...apt,
    id: `apt_${Math.random().toString(36).slice(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  items.push(newApt);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(items));
  return newApt;
}

export function getAppointments(): FollowUpAppointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getDueAppointments(): FollowUpAppointment[] {
  const all = getAppointments();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return all.filter((apt) => {
    if (apt.status !== 'pending') return false;
    const scheduled = new Date(apt.scheduledAt).getTime();
    return scheduled - now < dayMs;
  });
}

export function markAppointmentComplete(id: string): void {
  const items = getAppointments();
  const apt = items.find((i) => i.id === id);
  if (apt) apt.status = 'completed';
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(items));
}
