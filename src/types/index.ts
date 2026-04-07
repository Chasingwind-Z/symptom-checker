export type RiskLevel = 'green' | 'yellow' | 'orange' | 'red';
export type AgentId =
  | 'orchestrator'
  | 'triage'
  | 'evidence'
  | 'careNavigator'
  | 'publicHealth'
  | 'memory';
export type AgentBadgeTone = 'slate' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

export interface AgentBadge {
  id: AgentId;
  label: string;
  shortLabel: string;
  tone: AgentBadgeTone;
}

export interface AgentStep {
  id: AgentId;
  label: string;
  focus: string;
  status: 'lead' | 'active' | 'standby';
}

export interface AgentRoute {
  primary: AgentBadge;
  activeAgents: AgentBadge[];
  summary: string;
  reasoning: string;
  steps: AgentStep[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: ChatImageAttachment[];
  suggestions?: string[];
  toolCalls?: ToolCall[];
  agentRoute?: AgentRoute;
}

export interface ChatImageAttachment {
  id: string;
  kind: 'image';
  name: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
  dataUrl: string;
}

export interface SendMessageInput {
  text: string;
  attachments?: ChatImageAttachment[];
}

export interface DiagnosisResult {
  level: RiskLevel;
  reason: string;
  action: string;
  departments: string[];
  disclaimer: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  riskLevel: RiskLevel | null;
  diagnosisResult: DiagnosisResult | null;
  messages: Message[];
  storage: 'local' | 'supabase';
}

export interface OfficialSourceRecord {
  id: string;
  title: string;
  sourceLabel: string;
  sourceType: string;
  status: string;
  lastUpdated: string;
  summary: string;
  url?: string;
  linkLabel?: string;
  scope?: 'local' | 'national' | 'international';
  city?: string;
}

export type OfficialSourceFetchState = 'idle' | 'loading' | 'ready' | 'error';
export type OfficialSourceSyncMode = 'seeded-local' | 'server-cache' | 'server-live';
export type OfficialSourceFreshness = 'seeded' | 'fresh' | 'recent' | 'stale';

export interface OfficialSourceSyncStatus {
  state: OfficialSourceFetchState;
  mode: OfficialSourceSyncMode;
  freshness: OfficialSourceFreshness;
  sourceLabel: string;
  summary: string;
  note: string;
  lastSyncTime: string;
  latestRecordTime: string;
  fallbackActive: boolean;
  configured: boolean;
  fetchedAt: number;
  error?: string;
}

export interface OfficialSourceBundle {
  records: OfficialSourceRecord[];
  syncStatus: OfficialSourceSyncStatus;
}

export type FollowUpResponseOption = '明显好转' | '略有好转' | '没有变化' | '更严重了';
export type FollowUpRecordStatus = 'pending' | 'completed';

export interface FollowUpRecord {
  id: string;
  summary: string;
  level: RiskLevel;
  createdAt: number;
  district: string;
  status: FollowUpRecordStatus;
  dueAt: number;
  response?: FollowUpResponseOption;
  respondedAt?: number;
}

export interface Hospital {
  id: string;
  name: string;
  type: '三甲医院' | '二甲医院' | '社区诊所' | '专科医院';
  distance: string;
  address: string;
  phone: string;
  emergency: boolean;
  departments: string[];
  rating: number;
  waitTime: string;
  openNow: boolean;
  latitude: number;
  longitude: number;
}

export interface ToolCall {
  id: string;
  name: string;
  displayName: string;
  status: 'running' | 'done' | 'error';
  arguments?: Record<string, unknown>;
  summary?: string;
  result?: Record<string, unknown>;
}

export interface SymptomInfo {
  id: string;
  name: string;
  aliases: string[];
  danger_signs: string[];
  departments: string[];
  self_care: string[];
  when_to_worry: string;
  default_min_level: RiskLevel;
  source?: string;
  source_url?: string;
}

export interface SymptomReport {
  id: string;
  symptoms: string[];
  level: RiskLevel;
  timestamp: number;
  district: string;
  followUpStatus?: FollowUpResponseOption;
  summary?: string;
}

export interface SymptomTrackingEntry {
  id: string
  sessionId: string
  timestamp: number
  symptoms: string[]
  severity: 'mild' | 'moderate' | 'severe'
  level: 'green' | 'yellow' | 'orange' | 'red'
  followUpStatus: 'pending' | 'better' | 'same' | 'worse'
  followUpTimestamp?: number
  notes?: string
}

export interface SymptomTimeline {
  entries: SymptomTrackingEntry[]
  activeTracking: string[]
}
