import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSidebar,
  DESKTOP_SIDEBAR_COLLAPSED_WIDTH,
  DESKTOP_SIDEBAR_EXPANDED_WIDTH,
  type SidebarSection,
} from './components/AppSidebar';
import { AgentOrchestrationPanel } from './components/AgentOrchestrationPanel';
import { AuthDialog } from './components/AuthDialog';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput, type ChatInputLayoutMetrics } from './components/ChatInput';
import { ConversationHistoryPanel } from './components/ConversationHistoryPanel';
import { DiagnosisProgress } from './components/DiagnosisProgress';
import { Header } from './components/Header';
import { HealthSettingsPanel } from './components/HealthSettingsPanel';
import {
  RecordsCenterPanel,
  type RecordsCenterSummaryItem,
} from './components/RecordsCenterPanel';
import { SearchIntelligencePanel, type ConnectedWebSearchState } from './components/SearchIntelligencePanel';
import { ToolCallIndicator } from './components/ToolCallIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InfoBar } from './components/WeatherBar';
import { useChat } from './hooks/useChat';
import { useHealthWorkspace } from './hooks/useHealthWorkspace';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { searchWebSources } from './lib/agentTools';
import type { CaseHistoryItem } from './lib/healthData';
import { deleteCaseHistoryItem } from './lib/healthData';
import {
  getConsultationModePreset,
  type ConsultationModeId,
} from './lib/consultationModes';
import { getRecommendedHospitals } from './lib/mockHospitals';
import { searchMedicalKnowledge } from './lib/medicalKnowledge';
import { getUserLocation, searchNearbyHospitals } from './lib/nearbyHospitals';
import { buildProfileCompletionGuide } from './lib/healthWorkspaceInsights';
import {
  DEFAULT_EXPERIENCE_SETTINGS,
  loadExperienceSettings,
  saveExperienceSettings,
  type ChatDensityPreference,
  type DesktopSidebarMode,
  type LocationPreference,
  type OfficialSourcePreference,
} from './lib/experienceSettings';
import {
  applyPersonalizedOrdering,
  buildCombinedMedicalNotes,
  buildPersonalizationRankingContext,
  getMedicationGuidance,
} from './lib/personalization';
import type { ConversationSession, Hospital, SendMessageInput } from './types';

const WORKSPACE_TAB_LABELS: Record<SidebarSection, string> = {
  search: '统一搜索',
  profile: '健康档案',
  history: '会话线程',
  records: '记录中心',
  medication: '买药 / 用药',
  settings: '问诊设置',
};

const LazyEpidemicDashboard = lazy(() =>
  import('./components/EpidemicDashboard').then((module) => ({
    default: module.EpidemicDashboard,
  }))
);

const LazyMedicationRecommendationsPanel = lazy(() =>
  import('./components/MedicationRecommendationsPanel').then((module) => ({
    default: module.MedicationRecommendationsPanel,
  }))
);

const LazyCloudSyncCard = lazy(() =>
  import('./components/CloudSyncCard').then((module) => ({
    default: module.CloudSyncCard,
  }))
);

const LazyResultCard = lazy(() =>
  import('./components/ResultCard').then((module) => ({
    default: module.ResultCard,
  }))
);

type ShellBannerTone = 'warning' | 'success' | 'info';

interface ShellBannerAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

interface ShellStatusBannerProps {
  tone: ShellBannerTone;
  title: string;
  description: string;
  primaryAction?: ShellBannerAction;
  secondaryAction?: ShellBannerAction;
}

const SHELL_BANNER_STYLES: Record<
  ShellBannerTone,
  {
    container: string;
    icon: string;
    title: string;
    description: string;
    primaryButton: string;
    secondaryButton: string;
  }
> = {
  warning: {
    container: 'border-amber-200 bg-amber-50/95',
    icon: 'bg-amber-100 text-amber-700',
    title: 'text-amber-950',
    description: 'text-amber-900/80',
    primaryButton: 'bg-amber-700 text-white hover:bg-amber-800',
    secondaryButton: 'border border-amber-200 bg-white text-amber-900 hover:bg-amber-100',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50/95',
    icon: 'bg-emerald-100 text-emerald-700',
    title: 'text-emerald-950',
    description: 'text-emerald-900/80',
    primaryButton: 'bg-emerald-700 text-white hover:bg-emerald-800',
    secondaryButton: 'border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-100',
  },
  info: {
    container: 'border-sky-200 bg-sky-50/95',
    icon: 'bg-sky-100 text-sky-700',
    title: 'text-sky-950',
    description: 'text-sky-900/80',
    primaryButton: 'bg-sky-700 text-white hover:bg-sky-800',
    secondaryButton: 'border border-sky-200 bg-white text-sky-900 hover:bg-sky-100',
  },
};

function ShellStatusBanner({
  tone,
  title,
  description,
  primaryAction,
  secondaryAction,
}: ShellStatusBannerProps) {
  const Icon = tone === 'warning' ? WifiOff : tone === 'success' ? CheckCircle2 : AlertTriangle;
  const styles = SHELL_BANNER_STYLES[tone];

  const renderAction = (
    action: ShellBannerAction,
    variant: 'primary' | 'secondary'
  ) => (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled || action.isLoading}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton
      }`}
    >
      {action.isLoading && <RefreshCw size={14} className="animate-spin" />}
      {action.label}
    </button>
  );

  return (
    <section
      className={`rounded-2xl border px-4 py-3 shadow-sm ${styles.container}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-2xl p-2 ${styles.icon}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${styles.description}`}>{description}</p>
          </div>
        </div>

        {(secondaryAction || primaryAction) && (
          <div className="flex flex-wrap gap-2">
            {secondaryAction && renderAction(secondaryAction, 'secondary')}
            {primaryAction && renderAction(primaryAction, 'primary')}
          </div>
        )}
      </div>
    </section>
  );
}

function LazySurfaceFallback({
  title,
  description,
  fullHeight = false,
}: {
  title: string;
  description: string;
  fullHeight?: boolean;
}) {
  const content = (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 px-6 py-7 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        <RefreshCw size={14} className="animate-spin" />
        正在准备内容
      </div>
      <h2 className="mt-3 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );

  if (fullHeight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-6 md:px-6">
        {content}
      </div>
    );
  }

  return content;
}

function getReportCount(): number {
  try {
    return (JSON.parse(localStorage.getItem('symptom_reports') ?? '[]') as unknown[]).length;
  } catch {
    return 0;
  }
}

function stripRecordMetadata(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRecordKey(content: string): string {
  return stripRecordMetadata(content).replace(/[^a-z0-9\u4e00-\u9fff]/gi, '').toLowerCase();
}

function matchesSearchQuery(value: string | null | undefined, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return normalizeRecordKey(value ?? '').includes(normalizedQuery);
}

function getConversationReferenceText(session: ConversationSession): string {
  const firstUserMessage = session.messages.find((message) => message.role === 'user');
  return stripRecordMetadata(firstUserMessage?.content ?? session.title);
}

function findMatchingConversation(
  summary: string,
  sessions: ConversationSession[]
): ConversationSession | null {
  const summaryKey = normalizeRecordKey(summary);
  if (!summaryKey) return null;

  return (
    sessions.find((session) => {
      const sessionKey = normalizeRecordKey(getConversationReferenceText(session));
      return Boolean(sessionKey) && (sessionKey.includes(summaryKey) || summaryKey.includes(sessionKey));
    }) ?? null
  );
}

function findMatchingCase(summary: string, recentCases: CaseHistoryItem[]): CaseHistoryItem | null {
  const summaryKey = normalizeRecordKey(summary);
  if (!summaryKey) return null;

  return (
    recentCases.find((item) => {
      const caseKey = normalizeRecordKey(item.chiefComplaint);
      return Boolean(caseKey) && (caseKey.includes(summaryKey) || summaryKey.includes(caseKey));
    }) ?? null
  );
}

function formatDateTimeLabel(value: string | number): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '刚刚';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function trimText(text: string, maxLength = 92): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function getConversationSourceLabel(storage: ConversationSession['storage']): string {
  return storage === 'supabase' ? '云端会话' : '本机会话';
}

function getCaseSourceLabel(source: CaseHistoryItem['source']): string {
  return source === 'supabase' ? '云端摘要' : '本机摘要';
}

export default function App() {
  const workspace = useHealthWorkspace();
  const network = useNetworkStatus();
  const pwa = usePwaInstall();
  const [selectedConsultationModeId, setSelectedConsultationModeId] = useState<ConsultationModeId | null>(
    null
  );
  const [welcomeDraftValue, setWelcomeDraftValue] = useState('');
  const [welcomeFocusSignal, setWelcomeFocusSignal] = useState(0);
  const selectedConsultationMode = useMemo(
    () => getConsultationModePreset(selectedConsultationModeId),
    [selectedConsultationModeId]
  );
  const chatMemoryContext = useMemo(
    () => ({
      profile: {
        ...workspace.profile,
        medicalNotes: buildCombinedMedicalNotes(workspace.profile),
      },
      consultationMode: selectedConsultationMode
        ? {
            id: selectedConsultationMode.id,
            label: selectedConsultationMode.label,
            subtitle: selectedConsultationMode.subtitle,
            promptNote: selectedConsultationMode.promptNote,
          }
        : null,
      recentCases: workspace.recentCases,
    }),
    [selectedConsultationMode, workspace.profile, workspace.recentCases]
  );
  const {
    messages,
    isLoading,
    streamingContent,
    diagnosisResult,
    isSearchingKB,
    activeToolCalls,
    activeAgentRoute,
    weatherData,
    activeSessionId,
    conversationSessions,
    locationData,
    pendingFollowUpRecords,
    completedFollowUpRecords,
    activeFollowUpRecord,
    sendMessage,
    openFollowUpRecord,
    loadConversationSession,
    deleteConversationSession,
    resetChat,
  } = useChat(chatMemoryContext);

  const bottomRef = useRef<HTMLDivElement>(null);
  const previousShellStateRef = useRef<{
    page: 'home' | 'chat' | 'workspace';
    section: SidebarSection;
  }>({
    page: 'home',
    section: 'profile',
  });
  const [reportCount, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'workspace' | 'map'>('home');
  const [workspaceSection, setWorkspaceSection] = useState<SidebarSection>('profile');
  const [experienceSettings, setExperienceSettings] = useState(loadExperienceSettings);
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [connectedWebSearch, setConnectedWebSearch] = useState<ConnectedWebSearchState>({
    status: 'idle',
  });
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [chatInputLayout, setChatInputLayout] = useState<ChatInputLayoutMetrics>({
    height: 148,
    keyboardOffset: 0,
    isFocused: false,
  });
  const profileCompletion = useMemo(
    () => buildProfileCompletionGuide(workspace.profile).progress,
    [workspace.profile]
  );
  const isSidebarCollapsed = experienceSettings.desktopSidebarMode === 'collapsed';
  const authActionLabel = workspace.sessionEmail ? '管理账号' : '登录 / 注册';
  const desktopSidebarWidth = isSidebarCollapsed
    ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
    : DESKTOP_SIDEBAR_EXPANDED_WIDTH;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    saveExperienceSettings(experienceSettings);
  }, [experienceSettings]);

  useEffect(() => {
    if (!diagnosisResult) {
      return;
    }

    let cancelled = false;

    const loadHospitalsForResult = async () => {
      try {
        if (experienceSettings.locationPreference === 'device') {
          const [lng, lat] = await getUserLocation();
          const nextHospitals = await searchNearbyHospitals(lng, lat, diagnosisResult.level);

          if (!cancelled) {
            setHospitals(nextHospitals);
          }
          return;
        }
      } catch {
        // Fall back to symptom-based hospital suggestions below when precise lookup is unavailable.
      }

      if (!cancelled) {
        setHospitals(getRecommendedHospitals(diagnosisResult.level, diagnosisResult.departments));
      }
    };

    void loadHospitalsForResult();

    return () => {
      cancelled = true;
    };
  }, [diagnosisResult, experienceSettings.locationPreference]);

  const defaultWorkspaceSection: SidebarSection = 'records';

  const handleSendMessage = useCallback(
    (input: string | SendMessageInput) => {
      setCurrentPage('chat');
      setWelcomeDraftValue('');
      sendMessage(input);
    },
    [sendMessage]
  );

  const handleStartConsultation = useCallback(() => {
    setWelcomeFocusSignal((current) => current + 1);
  }, []);

  const handleApplyStarterText = useCallback((text: string) => {
    setWelcomeDraftValue(text);
    setWelcomeFocusSignal((current) => current + 1);
  }, []);

  const handleSelectConsultationMode = useCallback((modeId: ConsultationModeId) => {
    setSelectedConsultationModeId(modeId);
    window.setTimeout(() => {
      setWelcomeFocusSignal((current) => current + 1);
    }, 320);
  }, []);

  const handleClearSelectedConsultationMode = useCallback(() => {
    setSelectedConsultationModeId(null);
  }, []);

  const handleResetChat = useCallback(() => {
    resetChat();
    setSelectedConsultationModeId(null);
    setWelcomeDraftValue('');
    setCurrentPage('home');
  }, [resetChat]);

  const handleOpenConversation = useCallback(
    (sessionId: string) => {
      if (loadConversationSession(sessionId)) {
        setSelectedConsultationModeId(null);
        setWelcomeDraftValue('');
        setCurrentPage('chat');
      }
    },
    [loadConversationSession]
  );

  const handleDeleteConversation = useCallback(
    (sessionId: string) => {
      const target = conversationSessions.find((session) => session.id === sessionId)
      if (!target) return

      const confirmed = window.confirm(`确认删除会话“${target.title}”？删除后将不再出现在历史与搜索结果中。`)
      if (!confirmed) return

      const deletedSession = deleteConversationSession(sessionId)
      if (!deletedSession) return

      if (activeSessionId === sessionId) {
        setSelectedConsultationModeId(null)
        setWelcomeDraftValue('')
        setCurrentPage('home')
      }
    },
    [activeSessionId, conversationSessions, deleteConversationSession]
  )

  const handleDeleteCaseRecord = useCallback(async (caseId: string, title: string) => {
    const confirmed = window.confirm(`确认删除记录“${title}”？删除后将从记录中心与搜索结果里移除。`)
    if (!confirmed) return

    await deleteCaseHistoryItem(caseId)
    await workspace.refresh()
  }, [workspace])

  const handleOpenWorkspaceSection = useCallback((section: SidebarSection) => {
    setWorkspaceSection(section);
    setCurrentPage('workspace');
  }, []);

  const handleOpenWorkspace = useCallback(() => {
    setWorkspaceSection(defaultWorkspaceSection);
    setCurrentPage('workspace');
  }, [defaultWorkspaceSection]);

  const handleOpenSettings = useCallback(() => {
    handleOpenWorkspaceSection('settings');
  }, [handleOpenWorkspaceSection]);

  const handleChatInputLayoutChange = useCallback((nextLayout: ChatInputLayoutMetrics) => {
    setChatInputLayout((previousLayout) =>
      previousLayout.height === nextLayout.height &&
      previousLayout.keyboardOffset === nextLayout.keyboardOffset &&
      previousLayout.isFocused === nextLayout.isFocused
        ? previousLayout
        : nextLayout
    );
  }, []);

  const handleDesktopSidebarModeChange = useCallback((value: DesktopSidebarMode) => {
    setExperienceSettings((current) =>
      current.desktopSidebarMode === value ? current : { ...current, desktopSidebarMode: value }
    );
  }, []);

  const handleLocationPreferenceChange = useCallback((value: LocationPreference) => {
    setExperienceSettings((current) =>
      current.locationPreference === value ? current : { ...current, locationPreference: value }
    );
  }, []);

  const handleOfficialSourcePreferenceChange = useCallback((value: OfficialSourcePreference) => {
    setExperienceSettings((current) =>
      current.officialSourcePreference === value
        ? current
        : { ...current, officialSourcePreference: value }
    );
  }, []);

  const handleChatDensityChange = useCallback((value: ChatDensityPreference) => {
    setExperienceSettings((current) =>
      current.chatDensity === value ? current : { ...current, chatDensity: value }
    );
  }, []);

  const handleToggleSidebarCollapse = useCallback(() => {
    setExperienceSettings((current) => ({
      ...current,
      desktopSidebarMode: current.desktopSidebarMode === 'collapsed' ? 'expanded' : 'collapsed',
    }));
  }, []);

  const handleResetExperienceSettings = useCallback(() => {
    setExperienceSettings({ ...DEFAULT_EXPERIENCE_SETTINGS });
  }, []);

  const handleRecordSearchChange = useCallback((value: string) => {
    setRecordSearchQuery(value);
    setConnectedWebSearch(
      value.trim()
        ? {
            status: 'loading',
            sourceLabel: '公开资料检索',
          }
        : { status: 'idle' }
    );
    if (value.trim()) {
      setWorkspaceSection('search');
      setCurrentPage('workspace');
    }
  }, []);

  const handleOpenMap = useCallback(() => {
    const previousPage =
      currentPage === 'workspace'
        ? 'workspace'
        : currentPage === 'home' && messages.length > 0
          ? 'chat'
          : currentPage === 'map'
            ? 'home'
            : currentPage;

    previousShellStateRef.current = {
      page: previousPage,
      section: workspaceSection,
    };
    setCurrentPage('map');
  }, [currentPage, messages.length, workspaceSection]);

  const handleOpenAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const handleCloseAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const handleOpenFollowUp = useCallback(
    (recordId: string) => {
      if (openFollowUpRecord(recordId)) {
        setCurrentPage('chat');
      }
    },
    [openFollowUpRecord]
  );

  const recordsCenterFollowUps = useMemo(() => {
    return pendingFollowUpRecords.map((record) => {
      const matchedSession = findMatchingConversation(record.summary, conversationSessions);
      const matchedCase = findMatchingCase(record.summary, workspace.recentCases);
      const summaryContext =
        matchedSession?.diagnosisResult?.reason ??
        matchedCase?.assistantPreview ??
        `系统已为“${record.summary}”生成后续跟进提醒，建议补充症状变化和就诊进度。`;

      return {
        id: record.id,
        title: record.summary,
        summary: trimText(`围绕这次记录继续补充变化：${summaryContext}`),
        statusLabel: activeFollowUpRecord?.id === record.id ? '正在回复' : '待跟进',
        metaLabel: `回访时间 · ${formatDateTimeLabel(record.dueAt)}`,
        sourceLabel: matchedSession
          ? `${getConversationSourceLabel(matchedSession.storage)} · 原问诊`
          : matchedCase
            ? `${getCaseSourceLabel(matchedCase.source)} · 问诊摘要`
            : '自动随访',
        riskLevel: matchedSession?.riskLevel ?? matchedCase?.triageLevel ?? record.level,
        tags: [record.district],
        isActive: activeFollowUpRecord?.id === record.id,
        primaryAction: {
          label: activeFollowUpRecord?.id === record.id ? '继续回复' : '回复随访',
          onClick: () => handleOpenFollowUp(record.id),
          tone: 'primary' as const,
        },
        secondaryAction: matchedSession
          ? {
              label: '打开记录',
              onClick: () => handleOpenConversation(matchedSession.id),
            }
          : undefined,
      };
    });
  }, [
    activeFollowUpRecord,
    conversationSessions,
    handleOpenConversation,
    handleOpenFollowUp,
    pendingFollowUpRecords,
    workspace.recentCases,
  ]);

  const recordsCenterSummaries = useMemo(() => {
    const items: RecordsCenterSummaryItem[] = [];
    const linkedSessionIds = new Set<string>();

    completedFollowUpRecords.slice(0, 3).forEach((record) => {
      const matchedSession = findMatchingConversation(record.summary, conversationSessions);
      const matchedCase = findMatchingCase(record.summary, workspace.recentCases);
      if (matchedSession) {
        linkedSessionIds.add(matchedSession.id);
      }

      const responseLabel = record.response ? `最近一次随访反馈：${record.response}。` : '该随访已完成。';
      const contextSummary =
        matchedSession?.diagnosisResult?.reason ??
        matchedCase?.assistantPreview ??
        '可继续打开相关记录，回看上次的问诊判断与后续建议。';

        items.push({
          id: `followup-summary-${record.id}`,
          title: `随访 · ${record.summary}`,
          summary: trimText(`${responseLabel}${contextSummary}`),
        metaLabel: `完成于 ${formatDateTimeLabel(record.respondedAt ?? record.createdAt)}`,
        sourceLabel: matchedSession
          ? `${getConversationSourceLabel(matchedSession.storage)} · 已完成随访`
          : matchedCase
            ? `${getCaseSourceLabel(matchedCase.source)} · 已完成随访`
            : '已完成随访',
        departments: matchedSession?.diagnosisResult?.departments ?? matchedCase?.departments ?? [],
        riskLevel: matchedSession?.riskLevel ?? matchedCase?.triageLevel ?? record.level,
          primaryAction: matchedSession
            ? {
                label: '继续咨询',
                onClick: () => handleOpenConversation(matchedSession.id),
                tone: 'primary',
              }
            : undefined,
          onDelete: matchedSession
            ? () => handleDeleteConversation(matchedSession.id)
            : matchedCase
              ? () => {
                  void handleDeleteCaseRecord(matchedCase.id, matchedCase.chiefComplaint)
                }
              : undefined,
        });
      });

    conversationSessions
      .filter((session) => session.diagnosisResult && !linkedSessionIds.has(session.id))
      .slice(0, Math.max(0, 4 - items.length))
      .forEach((session) => {
        items.push({
          id: session.id,
          title: session.title,
          summary: trimText(
            session.diagnosisResult?.reason ?? '已生成分诊摘要，可继续回到原会话补充新的变化。'
          ),
          metaLabel: `更新于 ${formatDateTimeLabel(session.updatedAt)}`,
          sourceLabel: getConversationSourceLabel(session.storage),
          departments: session.diagnosisResult?.departments ?? [],
          riskLevel: session.riskLevel ?? session.diagnosisResult?.level ?? null,
          primaryAction: {
            label: '继续咨询',
            onClick: () => handleOpenConversation(session.id),
            tone: 'primary',
          },
          onDelete: () => handleDeleteConversation(session.id),
        });
      });

    return items;
  }, [
    completedFollowUpRecords,
    conversationSessions,
    handleDeleteCaseRecord,
    handleDeleteConversation,
    handleOpenConversation,
    workspace.recentCases,
  ]);

  const normalizedSearchQuery = useMemo(
    () => normalizeRecordKey(recordSearchQuery),
    [recordSearchQuery]
  );
  const knowledgeSearchPreview = useMemo(
    () =>
      normalizedSearchQuery ? searchMedicalKnowledge(recordSearchQuery.trim(), { limit: 8 }) : null,
    [normalizedSearchQuery, recordSearchQuery]
  );

  useEffect(() => {
    if (workspaceSection !== 'search' || !recordSearchQuery.trim()) return;

    let cancelled = false;
    const query = recordSearchQuery.trim();
    const timeoutId = window.setTimeout(() => {
      void searchWebSources(query)
        .then((result) => {
          if (cancelled) return;
          setConnectedWebSearch({
            status: 'ready',
            sourceLabel: result.sourceLabel,
            fetchedAt: result.fetchedAt,
            message: result.message,
            results: result.results,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setConnectedWebSearch({
            status: 'error',
            sourceLabel: '公开资料检索',
            message: '联网检索暂时不可用，可先查看本地知识命中或改用外部搜索。',
          });
        });
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [recordSearchQuery, workspaceSection]);

  const personalizationRankingContext = useMemo(
    () =>
      buildPersonalizationRankingContext({
        profile: workspace.profile,
        recentCases: workspace.recentCases,
        recentSessions: conversationSessions,
      }),
    [conversationSessions, workspace.profile, workspace.recentCases]
  );

  const matchedConversationSessions = useMemo(() => {
    if (!normalizedSearchQuery) return conversationSessions;

    return conversationSessions.filter((session) =>
      [
        session.title,
        getConversationReferenceText(session),
        session.diagnosisResult?.reason,
        session.diagnosisResult?.action,
        session.diagnosisResult?.departments.join(' '),
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [conversationSessions, normalizedSearchQuery]);

  const personalizedConversationSearch = useMemo(() => {
    if (!normalizedSearchQuery) {
      return { items: matchedConversationSessions, changed: false };
    }

    return applyPersonalizedOrdering(
      matchedConversationSessions,
      (session) => [
        session.title,
        getConversationReferenceText(session),
        session.diagnosisResult?.reason,
        session.diagnosisResult?.action,
        session.diagnosisResult?.departments.join(' '),
      ],
      personalizationRankingContext
    );
  }, [matchedConversationSessions, normalizedSearchQuery, personalizationRankingContext]);

  const filteredConversationSessions = personalizedConversationSearch.items;

  const matchedRecordsCenterFollowUps = useMemo(() => {
    if (!normalizedSearchQuery) return recordsCenterFollowUps;

    return recordsCenterFollowUps.filter((item) =>
      [
        item.title,
        item.summary,
        item.statusLabel,
        item.metaLabel,
        item.sourceLabel,
        item.tags?.join(' '),
        item.riskLevel ?? '',
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, recordsCenterFollowUps]);

  const personalizedRecordsCenterFollowUps = useMemo(() => {
    if (!normalizedSearchQuery) {
      return { items: matchedRecordsCenterFollowUps, changed: false };
    }

    return applyPersonalizedOrdering(
      matchedRecordsCenterFollowUps,
      (item) => [
        item.title,
        item.summary,
        item.statusLabel,
        item.metaLabel,
        item.sourceLabel,
        item.tags?.join(' '),
        item.riskLevel ?? '',
      ],
      personalizationRankingContext
    );
  }, [matchedRecordsCenterFollowUps, normalizedSearchQuery, personalizationRankingContext]);

  const filteredRecordsCenterFollowUps = personalizedRecordsCenterFollowUps.items;

  const matchedRecordsCenterSummaries = useMemo(() => {
    if (!normalizedSearchQuery) return recordsCenterSummaries;

    return recordsCenterSummaries.filter((item) =>
      [
        item.title,
        item.summary,
        item.metaLabel,
        item.sourceLabel,
        item.departments?.join(' '),
        item.riskLevel ?? '',
      ].some((value) => matchesSearchQuery(value, normalizedSearchQuery))
    );
  }, [normalizedSearchQuery, recordsCenterSummaries]);

  const personalizedRecordsCenterSummaries = useMemo(() => {
    if (!normalizedSearchQuery) {
      return { items: matchedRecordsCenterSummaries, changed: false };
    }

    return applyPersonalizedOrdering(
      matchedRecordsCenterSummaries,
      (item) => [
        item.title,
        item.summary,
        item.metaLabel,
        item.sourceLabel,
        item.departments?.join(' '),
        item.riskLevel ?? '',
      ],
      personalizationRankingContext
    );
  }, [matchedRecordsCenterSummaries, normalizedSearchQuery, personalizationRankingContext]);

  const filteredRecordsCenterSummaries = personalizedRecordsCenterSummaries.items;

  const filteredCaseCount = useMemo(() => {
    if (!normalizedSearchQuery) return workspace.recentCases.length;

    return workspace.recentCases.filter((item) =>
      [
        item.chiefComplaint,
        item.assistantPreview,
        item.departments.join(' '),
        item.triageLevel,
        item.status,
      ].some((value) => matchesSearchQuery(String(value ?? ''), normalizedSearchQuery))
    ).length;
  }, [normalizedSearchQuery, workspace.recentCases]);

  const medicationBadgeCount = useMemo(() => {
    if (!diagnosisResult) return 0;
    return getMedicationGuidance(diagnosisResult, workspace.profile).filter((item) => item.suitable)
      .length;
  }, [diagnosisResult, workspace.profile]);

  const searchPersonalizationHintVisible =
    Boolean(normalizedSearchQuery) &&
    (personalizedConversationSearch.changed ||
      personalizedRecordsCenterFollowUps.changed ||
      personalizedRecordsCenterSummaries.changed);
  const normalizedProfileCity = workspace.profile.city?.trim();
  const localCity =
    experienceSettings.locationPreference === 'none'
      ? null
      : normalizedProfileCity && normalizedProfileCity !== '中国大陆'
        ? normalizedProfileCity
        : null;
  const hospitalSectionTitle =
    experienceSettings.locationPreference === 'device' ? '附近推荐医院' : '对症医院建议';
  const hospitalSectionMeta =
    experienceSettings.locationPreference === 'device'
      ? '实时定位优先 · 支持导航 · 电话 · 地图查看'
      : experienceSettings.locationPreference === 'profile'
        ? localCity
          ? `未启用实时定位 · 可结合 ${localCity} 本地安排判断`
          : '未启用实时定位 · 按分诊等级与科室方向整理'
        : '未使用本地位置 · 按分诊等级与科室方向整理';

  const effectivePage = currentPage === 'home' && messages.length > 0 ? 'chat' : currentPage;
  const showWorkspace = effectivePage === 'workspace';
  const showWelcome = !showWorkspace && messages.length === 0;
  const showConversationShelf = !showWorkspace && !showWelcome && conversationSessions.length > 0;
  const contentWidthClass = showWorkspace
    ? workspaceSection === 'profile' || workspaceSection === 'settings'
      ? 'max-w-6xl'
      : 'max-w-5xl'
    : showWelcome
      ? 'max-w-5xl'
      : experienceSettings.chatDensity === 'compact'
        ? 'max-w-5xl'
        : 'max-w-4xl';
  const chatThreadClass =
    experienceSettings.chatDensity === 'compact' ? 'mt-1 space-y-2 py-3' : 'mt-2 space-y-3 py-4';
  const chatScrollPaddingBottom = showWorkspace || showWelcome
    ? '40px'
    : `${Math.max(148, chatInputLayout.height + chatInputLayout.keyboardOffset + 20)}px`;

  useEffect(() => {
    if (!chatInputLayout.isFocused || messages.length === 0 || showWorkspace) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 140);

    return () => window.clearTimeout(timeoutId);
  }, [chatInputLayout.isFocused, chatInputLayout.keyboardOffset, messages.length, showWorkspace]);

  const activeConversation = useMemo(
    () => conversationSessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, conversationSessions]
  );

  const currentConversationTitle =
    activeConversation?.title ??
    trimText(messages.find((message) => message.role === 'user')?.content ?? '当前问诊', 28);

  const pageHeader = useMemo(() => {
    if (effectivePage === 'workspace') {
      switch (workspaceSection) {
        case 'search':
          return {
            title: '统一搜索',
            subtitle: recordSearchQuery.trim()
              ? `已筛到 ${filteredConversationSessions.length} 段会话、${filteredRecordsCenterFollowUps.length} 项待跟进、${filteredCaseCount} 条摘要线索，并同步联动知识库与公开资料${
                   searchPersonalizationHintVisible ? '，并结合档案与最近记录微调排序。' : '。'
                 }`
              : '按症状、标题、科室或建议快速查找历史会话、医学知识和公开资料。',
          };
        case 'profile':
          return {
            title: '健康档案',
            subtitle: '管理基础资料、家庭成员和云端同步，后续问诊会自动沿用这些信息。',
          };
        case 'history':
          return {
            title: '会话线程',
            subtitle: recordSearchQuery.trim()
              ? `已按“${recordSearchQuery}”筛选历史线程${
                   searchPersonalizationHintVisible ? '，并结合档案与最近记录微调排序。' : '。'
                 }`
              : '所有问诊会按线程保存，方便随时回到原上下文继续咨询。',
          };
        case 'medication':
          return {
            title: '买药 / 用药',
            subtitle:
              '把最近问诊里的 OTC / 家庭处理方向前置展示出来，并保留风险提醒与回到原线程的入口。',
          };
        case 'settings':
          return {
            title: '问诊设置',
            subtitle:
              '调整侧栏宽度、定位使用方式、资料展示顺序和聊天排版；更改只保存在当前浏览器。',
          };
        default:
          return {
            title: '记录中心',
            subtitle:
              pendingFollowUpRecords.length > 0
                ? `当前有 ${pendingFollowUpRecords.length} 项待跟进，建议优先处理。`
                : '最近摘要与随访记录会集中显示在这里。',
          };
      }
    }

    if (effectivePage === 'chat') {
      return {
        title: currentConversationTitle,
        subtitle: activeFollowUpRecord
          ? `正在回复随访：${activeFollowUpRecord.summary}`
          : diagnosisResult
            ? '已生成分诊建议，可继续补充新的症状变化。'
            : '继续补充症状持续时间、变化和已采取的处理方式。',
      };
    }

    return {
      title: '开始症状自查',
      subtitle:
        conversationSessions.length > 0
          ? '左侧会保留最近问诊线程，方便随时继续。'
          : '先描述不适，再按提示补充关键信息。',
    };
  }, [
    activeFollowUpRecord,
    conversationSessions.length,
    currentConversationTitle,
    diagnosisResult,
    effectivePage,
    filteredCaseCount,
    filteredConversationSessions.length,
    filteredRecordsCenterFollowUps.length,
    pendingFollowUpRecords.length,
    recordSearchQuery,
    searchPersonalizationHintVisible,
    workspaceSection,
  ]);

  const shellBanner = !network.isOnline
    ? {
        tone: 'warning' as const,
        title: '当前处于离线状态',
        description:
          '已打开的问诊记录、档案草稿和最近缓存仍可查看；联网问诊、云端同步、地图与检索会在网络恢复后继续可用。',
      }
    : network.showReconnectNotice
      ? {
          tone: 'success' as const,
          title: '网络已恢复',
          description: '现在可以继续提交新问题、刷新同步状态，或重新打开地图与云端资料。',
          primaryAction: {
            label: workspace.isRefreshing ? '刷新中…' : '刷新同步状态',
            onClick: () => {
              void workspace.refresh();
            },
            isLoading: workspace.isRefreshing,
          },
          secondaryAction: {
            label: '关闭',
            onClick: network.dismissReconnectNotice,
          },
        }
      : workspace.mode === 'error'
        ? {
            tone: 'info' as const,
            title: workspace.statusLabel,
            description: `${workspace.helperText} 问诊和本机缓存仍可继续使用。`,
            primaryAction: network.isOnline
              ? {
                  label: workspace.isRefreshing ? '重连中…' : '重新连接',
                  onClick: () => {
                    void workspace.refresh();
                  },
                  isLoading: workspace.isRefreshing,
                }
              : undefined,
          }
        : null;

  useEffect(() => {
    document.title = `${currentPage === 'map' ? '健康地图' : pageHeader.title} · 健康助手`;
  }, [currentPage, pageHeader.title]);

  if (effectivePage === 'map') {
    return (
      <Suspense
        fallback={
          <LazySurfaceFallback
            title="正在打开健康地图"
            description="正在按需加载趋势图、官方资料对照和城市面板，准备好后会继续展示。"
            fullHeight
          />
        }
      >
        <LazyEpidemicDashboard
          onBack={() => {
            const previousShellState = previousShellStateRef.current;
            setWorkspaceSection(previousShellState.section);
            setCurrentPage(previousShellState.page);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 lg:flex">
      <AppSidebar
        activeSection={showWorkspace ? workspaceSection : effectivePage === 'chat' ? 'chat' : null}
        searchQuery={recordSearchQuery}
        sessions={filteredConversationSessions}
        activeSessionId={activeSessionId}
        onOpenSession={handleOpenConversation}
        onDeleteSession={handleDeleteConversation}
        onStartNewSession={handleResetChat}
        onSelectChat={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
        onSelectSearch={() => handleOpenWorkspaceSection('search')}
        onSelectProfile={() => handleOpenWorkspaceSection('profile')}
        onSelectHistory={() => handleOpenWorkspaceSection('history')}
        onSelectRecords={() => handleOpenWorkspaceSection('records')}
        onSelectMedication={() => handleOpenWorkspaceSection('medication')}
        onSelectSettings={handleOpenSettings}
        onOpenMap={handleOpenMap}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        onOpenAuth={handleOpenAuthDialog}
        authActionLabel={authActionLabel}
        sessionEmail={workspace.sessionEmail}
        currentCity={localCity}
        statusLabel={workspace.statusLabel}
        statusHelperText={workspace.helperText}
        profileCompletion={profileCompletion}
        pendingFollowUpCount={pendingFollowUpRecords.length}
        medicationBadge={medicationBadgeCount > 0 ? String(medicationBadgeCount) : undefined}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title={pageHeader.title}
          subtitle={pageHeader.subtitle}
          onReset={handleResetChat}
          onOpenWorkspace={handleOpenWorkspace}
          onToggleMap={handleOpenMap}
          onOpenAuth={handleOpenAuthDialog}
          onOpenSettings={handleOpenSettings}
          sessionEmail={workspace.sessionEmail}
          currentView={showWorkspace ? 'workspace' : effectivePage === 'home' ? 'home' : 'chat'}
          canInstallApp={pwa.canInstall}
          isAppInstalled={pwa.isInstalled}
          onInstallApp={() => {
            void pwa.promptInstall();
          }}
          diagnosisRiskLevel={diagnosisResult?.level ?? null}
        />

        {!showWorkspace && (
          <InfoBar
            weather={weatherData}
            profileCity={localCity}
            chronicConditions={workspace.profile.chronicConditions}
            onOpenMap={handleOpenMap}
          />
        )}

        {shellBanner && (
          <div className="px-4 pt-3 lg:px-6">
            <div className={`${contentWidthClass} mx-auto w-full`}>
              <ShellStatusBanner {...shellBanner} />
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto px-4 md:px-6"
          style={{ paddingBottom: chatScrollPaddingBottom }}
        >
          <div className={`${contentWidthClass} mx-auto w-full`}>
            {showWorkspace && (
              <div className="space-y-4 py-5">
                <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {(Object.keys(WORKSPACE_TAB_LABELS) as SidebarSection[]).map((section) => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => handleOpenWorkspaceSection(section)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        workspaceSection === section
                          ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {WORKSPACE_TAB_LABELS[section]}
                    </button>
                  ))}
                </div>

                {workspaceSection === 'search' && (
                  <div className="space-y-4">
                    <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="max-w-2xl">
                          <p className="text-sm font-semibold text-slate-900">统一搜索</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            支持按症状、标题、建议、科室和随访说明搜索会话与记录。
                          </p>
                        </div>
                        {recordSearchQuery.trim() && (
                          <button
                            type="button"
                            onClick={() => handleRecordSearchChange('')}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            清空关键词
                          </button>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Search size={16} className="text-slate-400" />
                        <input
                          value={recordSearchQuery}
                          onChange={(event) => handleRecordSearchChange(event.target.value)}
                          placeholder="例如：发烧、头痛、消化内科、复诊、去医院"
                          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      {searchPersonalizationHintVisible && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] text-violet-700">
                          <Sparkles size={12} />
                          已结合档案与最近记录排序
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] text-slate-500">匹配会话</p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {filteredConversationSessions.length} 段
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">覆盖标题、提问与分诊建议。</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] text-slate-500">待跟进</p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {filteredRecordsCenterFollowUps.length} 项
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">适合搜索随访提醒与待补充信息。</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-[11px] text-slate-500">问诊摘要</p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">{filteredCaseCount} 条</p>
                          <p className="mt-1 text-[11px] text-slate-500">支持按科室、风险和摘要内容查找。</p>
                        </div>
                      </div>
                    </section>

                    {recordSearchQuery.trim() && (
                      <SearchIntelligencePanel
                        query={recordSearchQuery.trim()}
                        knowledgeResult={knowledgeSearchPreview}
                        webSearch={connectedWebSearch}
                      />
                    )}

                    {recordSearchQuery.trim() ? (
                      <>
                        <ConversationHistoryPanel
                          sessions={filteredConversationSessions}
                          activeSessionId={activeSessionId}
                          onOpenSession={handleOpenConversation}
                          onDeleteSession={handleDeleteConversation}
                          onStartNewSession={handleResetChat}
                          title="匹配会话"
                          description={
                            searchPersonalizationHintVisible
                              ? `当前关键词“${recordSearchQuery}”命中的历史线程，已结合档案与最近记录微调排序`
                              : `当前关键词“${recordSearchQuery}”命中的历史线程`
                          }
                          emptyMessage="没有匹配到相关会话，请换一个症状或建议关键词。"
                        />

                        <RecordsCenterPanel
                          statusLabel="搜索结果"
                          title="匹配的记录与随访"
                          helperText={
                            searchPersonalizationHintVisible
                              ? '同步展示待跟进项目和最近完成的摘要，并结合档案与最近记录微调排序。'
                              : '同步展示待跟进项目和最近完成的摘要，方便直接回看或继续咨询。'
                          }
                          followUps={filteredRecordsCenterFollowUps}
                          recentSummaries={filteredRecordsCenterSummaries}
                          emptyFollowUpsMessage="没有匹配到待跟进项目。"
                          emptySummariesMessage="没有匹配到最近摘要。"
                        />
                      </>
                    ) : (
                      <section className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-5 py-10 text-center text-sm text-slate-500">
                        在上方输入症状、标题、科室或建议后，这里会同步展示匹配的会话、摘要和随访记录。
                      </section>
                    )}
                  </div>
                )}

                {workspaceSection === 'profile' && (
                  <div className="space-y-4">
                    <Suspense
                      fallback={
                        <LazySurfaceFallback
                          title="正在打开健康档案"
                          description="正在按需加载同步状态、档案摘要和个性化资料卡片。"
                        />
                      }
                    >
                      <LazyCloudSyncCard
                        mode={workspace.mode}
                        statusLabel={workspace.statusLabel}
                        helperText={workspace.helperText}
                        recentCases={workspace.recentCases}
                        profile={workspace.profile}
                        householdProfiles={workspace.householdProfiles}
                        reportCount={reportCount}
                        sessionEmail={workspace.sessionEmail}
                        onRefresh={workspace.refresh}
                        isRefreshing={workspace.isRefreshing}
                        onSaveProfile={workspace.updateProfile}
                        onApplyDemoPersona={workspace.loadDemoPersona}
                        onSaveHouseholdProfile={workspace.saveHouseholdProfile}
                        onRemoveHouseholdProfile={workspace.deleteHouseholdProfile}
                        onOpenWorkspaceSection={handleOpenWorkspaceSection}
                        onOpenAuth={handleOpenAuthDialog}
                      />
                    </Suspense>
                  </div>
                )}

                {workspaceSection === 'settings' && (
                  <HealthSettingsPanel
                    settings={experienceSettings}
                    currentCity={localCity}
                    conversationCount={conversationSessions.length}
                    pendingFollowUpCount={pendingFollowUpRecords.length}
                    sessionEmail={workspace.sessionEmail}
                    onDesktopSidebarModeChange={handleDesktopSidebarModeChange}
                    onLocationPreferenceChange={handleLocationPreferenceChange}
                    onOfficialSourcePreferenceChange={handleOfficialSourcePreferenceChange}
                    onChatDensityChange={handleChatDensityChange}
                    onReset={handleResetExperienceSettings}
                  />
                )}

                {workspaceSection === 'history' && (
                  <ConversationHistoryPanel
                    sessions={filteredConversationSessions}
                    activeSessionId={activeSessionId}
                    onOpenSession={handleOpenConversation}
                    onDeleteSession={handleDeleteConversation}
                    onStartNewSession={handleResetChat}
                    title={recordSearchQuery.trim() ? '筛选后的历史会话' : '历史会话'}
                    description={
                      recordSearchQuery.trim()
                        ? searchPersonalizationHintVisible
                          ? `已按“${recordSearchQuery}”筛选历史线程，并结合档案与最近记录微调排序。`
                          : `已按“${recordSearchQuery}”筛选历史线程。`
                        : '所有会话会按最近更新时间排序，点击即可回到原线程继续问诊。'
                    }
                    emptyMessage={
                      recordSearchQuery.trim()
                        ? '当前关键词没有匹配到会话。'
                        : '还没有历史会话。完成一次问诊后，这里会自动保存新的线程。'
                    }
                  />
                )}

                {workspaceSection === 'medication' && (
                  <Suspense
                    fallback={
                      <LazySurfaceFallback
                        title="正在准备用药建议"
                        description="正在按需加载个性化支持方向和风险提醒，马上就好。"
                      />
                    }
                  >
                    <LazyMedicationRecommendationsPanel
                      profile={workspace.profile}
                      currentDiagnosis={diagnosisResult}
                      activeSessionId={activeSessionId}
                      conversationSessions={conversationSessions}
                      recentCases={workspace.recentCases}
                      currentLocation={locationData}
                      onOpenConversation={handleOpenConversation}
                      onStartNewConversation={handleResetChat}
                    />
                  </Suspense>
                )}

                {workspaceSection === 'records' && (
                  <RecordsCenterPanel
                    statusLabel={
                      pendingFollowUpRecords.length > 0 ? '待处理随访与最近摘要' : '随访与记录'
                    }
                    helperText={
                      pendingFollowUpRecords.length > 0
                        ? '优先回复待跟进项目，再继续打开最近完成的摘要或原问诊记录。'
                        : '新的随访提醒和最近完成的摘要会统一汇总在这里，方便随时回看和继续咨询。'
                    }
                    followUps={recordsCenterFollowUps}
                    recentSummaries={recordsCenterSummaries}
                    emptyFollowUpsMessage="当前没有待回复随访。新的复诊提醒或观察任务出现后，会自动汇总在这里。"
                    emptySummariesMessage="还没有最近完成的摘要。完成一次问诊或随访后，记录中心会自动展示可继续打开的记录。"
                  />
                )}
              </div>
            )}

            {showWelcome && (
              <div className="w-full space-y-3 py-6 sm:py-7">
                <WelcomeScreen
                  onStartConsultation={handleStartConsultation}
                  onApplyStarterText={handleApplyStarterText}
                  selectedModeId={selectedConsultationModeId}
                  onSelectMode={handleSelectConsultationMode}
                  onToggleMap={handleOpenMap}
                  sessionEmail={workspace.sessionEmail}
                  profile={workspace.profile}
                  weather={weatherData}
                  pendingFollowUpCount={pendingFollowUpRecords.length}
                  recentCases={workspace.recentCases}
                  recentSessions={conversationSessions}
                  onOpenConversation={handleOpenConversation}
                />
                <ChatInput
                  variant="inline"
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  draftValue={welcomeDraftValue}
                  onDraftChange={setWelcomeDraftValue}
                  placeholderOverride={selectedConsultationMode?.placeholder}
                  selectedModeLabel={selectedConsultationMode?.label}
                  selectedModeSummary={selectedConsultationMode?.summary}
                  onClearSelectedMode={handleClearSelectedConsultationMode}
                  focusSignal={welcomeFocusSignal}
                />
              </div>
            )}

            {!showWorkspace && messages.length > 0 && (
              <div className={chatThreadClass}>
                {showConversationShelf && (
                  <div className="lg:hidden">
                    <ConversationHistoryPanel
                      sessions={conversationSessions}
                      activeSessionId={activeSessionId}
                      onOpenSession={handleOpenConversation}
                      onDeleteSession={handleDeleteConversation}
                      onStartNewSession={handleResetChat}
                      title="最近对话"
                      description="手机端也能在主聊天界面切换到之前的问诊线程。"
                      maxItems={6}
                      variant="shelf"
                      startButtonLabel="新对话"
                    />
                  </div>
                )}

                <DiagnosisProgress
                  messages={messages}
                  diagnosisResult={diagnosisResult}
                  isLoading={isLoading}
                  hasStreamingContent={Boolean(streamingContent)}
                />
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    onQuickReply={handleSendMessage}
                    diagnosisResult={!!diagnosisResult}
                    density={experienceSettings.chatDensity}
                  />
                ))}

                {streamingContent && (
                  <ChatBubble
                    message={{
                      id: 'streaming',
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date(),
                      agentRoute: activeAgentRoute ?? undefined,
                    }}
                    isStreaming
                    onQuickReply={handleSendMessage}
                    diagnosisResult={!!diagnosisResult}
                    density={experienceSettings.chatDensity}
                  />
                )}

                {isLoading && !streamingContent && (
                  <div className="mb-4 flex items-end gap-2">
                    <div className="flex-shrink-0 rounded-full bg-blue-100 p-1.5">
                      <div className="h-4 w-4 rounded-full bg-blue-300 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <AgentOrchestrationPanel route={activeAgentRoute} isLive compact />
                      <ToolCallIndicator
                        visible={isSearchingKB || activeToolCalls.length > 0}
                        toolCalls={activeToolCalls}
                      />
                      <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-medium text-slate-700">正在整理你的情况</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          马上会开始逐步回复；如果涉及外部资料检索，也会一并整理进本次建议。
                        </p>
                        <div className="flex gap-1">
                          <span
                            className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {diagnosisResult && !isLoading && (
                  <Suspense
                    fallback={
                      <LazySurfaceFallback
                        title="正在整理分诊结果"
                        description="正在按需加载风险解读、医院推荐和后续建议卡片。"
                      />
                    }
                  >
                    <LazyResultCard
                      result={diagnosisResult}
                      hospitals={hospitals}
                      messages={messages}
                      profile={workspace.profile}
                      recentCases={workspace.recentCases}
                      weather={weatherData}
                      officialSourceCity={localCity}
                      officialSourcePreference={experienceSettings.officialSourcePreference}
                      hospitalSectionTitle={hospitalSectionTitle}
                      hospitalSectionMeta={hospitalSectionMeta}
                      onReport={() => setReportCount(getReportCount())}
                      onOpenMedicationHub={() => handleOpenWorkspaceSection('medication')}
                      onToggleMap={handleOpenMap}
                    />
                  </Suspense>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {!showWorkspace && !showWelcome && (
          <ChatInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            withDesktopSidebar
            desktopSidebarWidth={desktopSidebarWidth}
            onLayoutChange={handleChatInputLayoutChange}
            selectedModeLabel={selectedConsultationMode?.label}
            selectedModeSummary={selectedConsultationMode?.summary}
            onClearSelectedMode={handleClearSelectedConsultationMode}
          />
        )}
      </div>

      <AuthDialog
        isOpen={isAuthDialogOpen}
        mode={workspace.mode}
        sessionEmail={workspace.sessionEmail}
        onClose={handleCloseAuthDialog}
        onRefresh={workspace.refresh}
      />
    </div>
  );
}
