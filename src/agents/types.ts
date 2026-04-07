import type { LocationData } from '../lib/geolocation';
import type { MedicalKnowledgeSearchResult } from '../lib/medicalKnowledge';
import type {
  AgentBadgeTone,
  AgentId,
  ChatImageAttachment,
  DiagnosisResult,
  Message,
  SymptomInfo,
} from '../types';

export interface AgentMemoryContext {
  profile?: {
    displayName?: string;
    city?: string;
    birthYear?: number | null;
    gender?: string;
    medicalNotes?: string;
  } | null;
  consultationMode?: {
    id: string;
    label: string;
    subtitle?: string;
    promptNote: string;
  } | null;
  recentCases?: Array<{
    chiefComplaint: string;
    triageLevel: DiagnosisResult['level'] | 'pending';
    departments: string[];
    assistantPreview: string;
    createdAt: string;
  }>;
}

export interface AgentPromptContext {
  userText: string;
  messages: Message[];
  attachments?: ChatImageAttachment[];
  locationData: LocationData | null;
  diagnosisResult: DiagnosisResult | null;
  kbResults: SymptomInfo[];
  knowledgeSearch?: MedicalKnowledgeSearchResult | null;
  pendingFollowUpSummary?: string | null;
  memoryContext?: AgentMemoryContext | null;
}

export interface SpecialistAgentDefinition {
  id: AgentId;
  label: string;
  shortLabel: string;
  tone: AgentBadgeTone;
  focus: string;
  allowedTools: string[];
  buildPrompt: (context: AgentPromptContext) => string;
}
