import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
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
import { FollowUpReminder } from './components/FollowUpReminder';
import { Header } from './components/Header';
import { OfficialBadge } from './components/OfficialBadge';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LazySurfaceFallback } from './components/LazySurfaceFallback';
import {
  type RecordsCenterSummaryItem,
} from './components/RecordsCenterPanel';
import { ShellStatusBanner } from './components/ShellStatusBanner';
import { ToolCallIndicator } from './components/ToolCallIndicator';
import { MobileBottomNav, MOBILE_BOTTOM_NAV_HEIGHT } from './components/MobileBottomNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InfoBar } from './components/WeatherBar';
import { WorkspaceView } from './components/WorkspaceView';
import { GuardianThemeProvider } from './contexts/GuardianThemeContext';
import { useChat } from './hooks/useChat';
import { useHealthWorkspace } from './hooks/useHealthWorkspace';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { usePwaInstall } from './hooks/usePwaInstall';
import { deleteCaseHistoryItem } from './lib/healthData';
import {
  getConsultationModePreset,
  type ConsultationModeId,
} from './lib/consultationModes';
import { getRecommendedHospitals } from './lib/mockHospitals';
import { getUserLocation, searchNearbyHospitals } from './lib/nearbyHospitals';
import {
  buildProfileCompletionGuide,
  type HouseholdProfileRecord,
} from './lib/healthWorkspaceInsights';
import {
  loadExperienceSettings,
  saveExperienceSettings,
} from './lib/experienceSettings';
import {
  buildCombinedMedicalNotes,
} from './lib/personalization';
import { saveAppointment } from './lib/followUpRecords';
import { requestPushPermission, scheduleFollowUpNotification } from './lib/pushNotification';
import {
  findMatchingCase,
  findMatchingConversation,
  formatDateTimeLabel,
  getCaseSourceLabel,
  getConversationSourceLabel,
  getReportCount,
  trimText,
} from './lib/appShellUtils';
import type { Hospital, SendMessageInput } from './types';

const LazyEpidemicDashboard = lazy(() =>
  import('./components/EpidemicDashboard').then((module) => ({
    default: module.EpidemicDashboard,
  }))
);

const LazyB2BDashboard = lazy(() =>
  import('./components/B2BDashboard').then((module) => ({
    default: module.B2BDashboard,
  }))
);

const LazyResultCard = lazy(() =>
  import('./components/ResultCard').then((module) => ({
    default: module.ResultCard,
  }))
);

export default function App() {
  const workspace = useHealthWorkspace();
  const network = useNetworkStatus();
  const pwa = usePwaInstall();
  const [selectedConsultationModeId, setSelectedConsultationModeId] = useState<ConsultationModeId | null>(
    () => (localStorage.getItem('selected_guardian_mode') as ConsultationModeId | null)
  );
  const [welcomeDraftValue, setWelcomeDraftValue] = useState('');
  const [welcomeFocusSignal, setWelcomeFocusSignal] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShareBanner, setShowShareBanner] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    () => localStorage.getItem('guest_banner_dismissed') === 'true'
  );

  useEffect(() => {
    const id = window.setTimeout(() => setShowOnboarding(!localStorage.getItem('onboarding_done')), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') === '1') {
      const id = window.setTimeout(() => setShowShareBanner(true), 0);
      return () => window.clearTimeout(id);
    }
  }, []);
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
    pendingFollowUpRecords,
    completedFollowUpRecords,
    activeFollowUpRecord,
    sendMessage,
    openFollowUpRecord,
    loadConversationSession,
    deleteConversationSession,
    resetChat,
    pendingFollowUp,
    setPendingFollowUp,
  } = useChat(chatMemoryContext);

  const bottomRef = useRef<HTMLDivElement>(null);
  const previousShellStateRef = useRef<{
    page: 'home' | 'chat' | 'workspace' | 'map' | 'b2b';
    section: SidebarSection;
  }>({
    page: 'home',
    section: 'profile',
  });
  const [reportCount, setReportCount] = useState<number>(getReportCount);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'workspace' | 'map' | 'b2b'>('home');
  const [workspaceSection, setWorkspaceSection] = useState<SidebarSection>('records');
  const [experienceSettings, setExperienceSettings] = useState(loadExperienceSettings);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [switchingHouseholdProfileId, setSwitchingHouseholdProfileId] = useState<string | null>(null);
  const [chatInputLayout, setChatInputLayout] = useState<ChatInputLayoutMetrics>({
    height: 148,
    keyboardOffset: 0,
    isFocused: false,
  });
  const profileCompletion = useMemo(
    () => buildProfileCompletionGuide(workspace.profile).progress,
    [workspace.profile]
  );
  const partnerBadge = useMemo(() => {
    try {
      const raw = localStorage.getItem('partner_badge');
      return raw ? (JSON.parse(raw) as { name: string }).name : null;
    } catch { return null; }
  }, []);
  const isConsulting = messages.length > 0 && !diagnosisResult;
  const isSidebarCollapsed = experienceSettings.desktopSidebarMode === 'collapsed';
  const authActionLabel = workspace.sessionEmail ? '管理账号' : '登录 / 注册';
  const desktopSidebarWidth = isConsulting
    ? 0
    : isSidebarCollapsed
      ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH
      : DESKTOP_SIDEBAR_EXPANDED_WIDTH;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // RAF loop keeps the view pinned to bottom while AI is streaming
  useEffect(() => {
    if (!streamingContent) return;
    let rafId: number;
    const scrollLoop = () => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      rafId = requestAnimationFrame(scrollLoop);
    };
    rafId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(rafId);
  }, [streamingContent]);

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

  const handleSelectHouseholdProfile = useCallback(
    async (record: HouseholdProfileRecord) => {
      setSwitchingHouseholdProfileId(record.id)

      try {
        await workspace.updateProfile(record.profile)

        const age = record.profile.birthYear
          ? new Date().getFullYear() - record.profile.birthYear
          : null
        const nextMode: ConsultationModeId =
          age !== null && age < 18
            ? 'child'
            : age !== null && age >= 60
              ? 'elderly'
              : record.profile.chronicConditions.trim()
                ? 'chronic'
                : 'self'

        setSelectedConsultationModeId(nextMode)
        setWelcomeDraftValue('')
      } finally {
        setSwitchingHouseholdProfileId(null)
      }
    },
    [workspace]
  )

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
    async (sessionId: string) => {
      const target = conversationSessions.find((session) => session.id === sessionId)
      if (!target) return

      const confirmed = window.confirm(`确认删除会话“${target.title}”？删除后将不再出现在历史与搜索结果中。`)
      if (!confirmed) return

      const deletedSession = deleteConversationSession(sessionId)
      if (!deletedSession) return

      if (deletedSession.storage === 'supabase') {
        await deleteCaseHistoryItem(sessionId)
        await workspace.refresh()
      }

      if (activeSessionId === sessionId) {
        setSelectedConsultationModeId(null)
        setWelcomeDraftValue('')
        setCurrentPage('home')
      }
    },
    [activeSessionId, conversationSessions, deleteConversationSession, workspace]
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
    handleOpenWorkspaceSection('profile');
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

  const handleToggleSidebarCollapse = useCallback(() => {
    setExperienceSettings((current) => ({
      ...current,
      desktopSidebarMode: current.desktopSidebarMode === 'collapsed' ? 'expanded' : 'collapsed',
    }));
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

  const handleOpenB2B = useCallback(() => {
    previousShellStateRef.current = {
      page: currentPage === 'b2b' ? 'home' : currentPage,
      section: workspaceSection,
    };
    setCurrentPage('b2b');
  }, [currentPage, workspaceSection]);

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

  const filteredConversationSessions = conversationSessions;

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

  // Mobile bottom nav is visible on home and workspace pages; hidden during active chat
  // so it never overlaps the floating ChatInput.
  const showMobileBottomNav = effectivePage !== 'chat';
  const mobileBottomNavActivePrimaryTab: 'chat' | 'records' | 'profile' | null =
    showWorkspace && workspaceSection === 'records'
      ? 'records'
      : showWorkspace && workspaceSection === 'profile'
        ? 'profile'
        : effectivePage === 'home'
          ? 'chat'
          : null;

  const contentWidthClass = showWorkspace
    ? workspaceSection === 'profile'
      ? 'max-w-6xl'
      : 'max-w-5xl'
    : showWelcome
      ? 'max-w-5xl'
      : experienceSettings.chatDensity === 'compact'
        ? 'max-w-5xl'
        : 'max-w-4xl';
  const chatThreadClass =
    experienceSettings.chatDensity === 'compact' ? 'mt-1 space-y-2 py-3' : 'mt-2 space-y-3 py-4';
  // On chat page the floating input drives the bottom padding; on home/workspace add room
  // for the mobile bottom nav bar (56 px) on small screens.
  const chatScrollPaddingBottom = showWorkspace || showWelcome
    ? `max(40px, calc(${MOBILE_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 8px))`
    : `${Math.max(148, chatInputLayout.height + chatInputLayout.keyboardOffset + 36)}px`;

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
        case 'profile':
          return {
            title: '我的',
            subtitle: '管理基础资料、家庭成员、偏好设置和云端同步，后续问诊会自动沿用这些信息。',
          };
        case 'records':
        default:
          return {
            title: '记录',
            subtitle:
              pendingFollowUpRecords.length > 0
                ? `当前有 ${pendingFollowUpRecords.length} 项待跟进，建议优先处理。`
                : '历史会话、摘要与随访记录会集中显示在这里。',
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
    pendingFollowUpRecords.length,
    workspaceSection,
  ]);;

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
            description: `${workspace.helperText} 问诊和当前设备保存的资料仍可继续使用。`,
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
    document.title = `${currentPage === 'map' ? '健康地图' : currentPage === 'b2b' ? '企业健康看板' : pageHeader.title} · 健康助手`;
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
          onOpenB2B={handleOpenB2B}
        />
      </Suspense>
    );
  }

  if (effectivePage === 'b2b') {
    return (
      <Suspense
        fallback={
          <LazySurfaceFallback
            title="正在打开企业看板"
            description="正在加载企业健康看板…"
            fullHeight
          />
        }
      >
        <LazyB2BDashboard
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
    <GuardianThemeProvider modeId={selectedConsultationModeId}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 lg:flex">
      {showShareBanner && (
        <div className="w-full bg-blue-600 text-white text-center text-sm py-2 px-4 lg:fixed lg:top-0 lg:z-50">
          查看朋友分享的问诊参考
          <button
            onClick={() => setShowShareBanner(false)}
            className="ml-3 text-white/80 hover:text-white"
            aria-label="关闭"
          >✕</button>
        </div>
      )}
      {!isConsulting && (
        <AppSidebar
          activeSection={showWorkspace ? workspaceSection : (effectivePage === 'chat' || effectivePage === 'home' ? 'chat' : null)}
          sessions={filteredConversationSessions}
          activeSessionId={activeSessionId}
          onOpenSession={handleOpenConversation}
          onDeleteSession={handleDeleteConversation}
          onStartNewSession={handleResetChat}
          onSelectChat={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
          onSelectProfile={() => handleOpenWorkspaceSection('profile')}
          onSelectRecords={() => handleOpenWorkspaceSection('records')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          onOpenAuth={handleOpenAuthDialog}
          authActionLabel={authActionLabel}
          sessionEmail={workspace.sessionEmail}
          statusLabel={workspace.statusLabel}
          statusHelperText={workspace.helperText}
          profileCompletion={profileCompletion}
          pendingFollowUpCount={pendingFollowUpRecords.length}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <OfficialBadge partnerName={partnerBadge ?? undefined} />
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

        {!workspace.sessionEmail && !guestBannerDismissed && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs text-slate-500">
              游客模式 · 数据保存在本设备 ·{' '}
              <button onClick={handleOpenAuthDialog} className="text-blue-500 hover:underline">
                登录同步到云端
              </button>
            </p>
            <button
              onClick={() => {
                setGuestBannerDismissed(true);
                localStorage.setItem('guest_banner_dismissed', 'true');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {!showWorkspace && !isConsulting && (
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
              <WorkspaceView
                workspaceSection={workspaceSection}
                onSelectSection={handleOpenWorkspaceSection}
                filteredConversationSessions={filteredConversationSessions}
                activeSessionId={activeSessionId}
                onOpenSession={handleOpenConversation}
                onDeleteSession={handleDeleteConversation}
                onStartNewSession={handleResetChat}
                workspaceMode={workspace.mode}
                workspaceStatusLabel={workspace.statusLabel}
                workspaceHelperText={workspace.helperText}
                profile={workspace.profile}
                recentCases={workspace.recentCases}
                householdProfiles={workspace.householdProfiles}
                reportCount={reportCount}
                sessionEmail={workspace.sessionEmail}
                onRefreshWorkspace={workspace.refresh}
                isRefreshingWorkspace={workspace.isRefreshing}
                onSaveProfile={workspace.updateProfile}
                onApplyDemoPersona={workspace.loadDemoPersona}
                onSaveHouseholdProfile={workspace.saveHouseholdProfile}
                onRemoveHouseholdProfile={workspace.deleteHouseholdProfile}
                onOpenWorkspaceSection={handleOpenWorkspaceSection}
                onOpenAuth={handleOpenAuthDialog}
                currentCity={localCity}
                conversationCount={conversationSessions.length}
                pendingFollowUpCount={pendingFollowUpRecords.length}
                recordsCenterFollowUps={recordsCenterFollowUps}
                recordsCenterSummaries={recordsCenterSummaries}
              />
            )}

            {showWelcome && (
              <div className="w-full space-y-3 py-6 sm:py-7">
                <WelcomeScreen
                  onStartConsultation={handleStartConsultation}
                  onApplyStarterText={handleApplyStarterText}
                  selectedModeId={selectedConsultationModeId}
                  onSelectMode={handleSelectConsultationMode}
                  onToggleMap={handleOpenMap}
                  onOpenEpidemicDashboard={handleOpenMap}
                  sessionEmail={workspace.sessionEmail}
                  profile={workspace.profile}
                  weather={weatherData}
                  pendingFollowUpCount={pendingFollowUpRecords.length}
                  householdProfiles={workspace.householdProfiles}
                  switchingHouseholdProfileId={switchingHouseholdProfileId}
                  recentCases={workspace.recentCases}
                  recentSessions={conversationSessions}
                  onOpenConversation={handleOpenConversation}
                  onSelectHouseholdProfile={handleSelectHouseholdProfile}
                  onManageProfiles={() => handleOpenWorkspaceSection('profile')}
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
                  messagesCount={messages.length}
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
                {(() => {
                  let assistantCount = 0;
                  return messages.map((msg) => {
                    if (msg.role === 'assistant') assistantCount++;
                    return (
                      <ChatBubble
                        key={msg.id}
                        message={msg}
                        onQuickReply={handleSendMessage}
                        diagnosisResult={!!diagnosisResult}
                        density={experienceSettings.chatDensity}
                        assistantMessageIndex={msg.role === 'assistant' ? assistantCount : undefined}
                      />
                    );
                  });
                })()}

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

                {pendingFollowUp && (
                  <div className="mx-4 mb-3 rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-800">📅 AI建议设置复诊提醒</p>
                        <p className="text-xs text-blue-600 mt-1">{pendingFollowUp.note}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            saveAppointment({
                              scheduledAt: pendingFollowUp.date,
                              note: pendingFollowUp.note,
                              originalSessionId: activeSessionId || undefined,
                            });
                            requestPushPermission().then(granted => {
                              if (granted) {
                                const delayMs = new Date(pendingFollowUp.date).getTime() - Date.now() - 24 * 60 * 60 * 1000;
                                scheduleFollowUpNotification(
                                  delayMs,
                                  '复诊提醒',
                                  '您有一个复诊预约即将到期，建议今天安排就医'
                                );
                              }
                            });
                            setPendingFollowUp(null);
                          }}
                          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                        >
                          设置提醒
                        </button>
                        <button
                          onClick={() => setPendingFollowUp(null)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-100"
                        >
                          跳过
                        </button>
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
                      consultationModeId={selectedConsultationModeId}
                      onReport={() => setReportCount(getReportCount())}
                      onOpenMedicationHub={() => handleOpenWorkspaceSection('records')}
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
            isConsulting={isConsulting}
            messagesCount={messages.length}
          />
        )}
      </div>

      {showMobileBottomNav && (
        <MobileBottomNav
          activePrimaryTab={mobileBottomNavActivePrimaryTab}
          pendingFollowUpCount={pendingFollowUpRecords.length}
          profileCompletion={profileCompletion}
          onSelectChat={() => setCurrentPage(messages.length > 0 ? 'chat' : 'home')}
          onSelectRecords={() => handleOpenWorkspaceSection('records')}
          onSelectProfile={() => handleOpenWorkspaceSection('profile')}
        />
      )}

      <AuthDialog
        isOpen={isAuthDialogOpen}
        mode={workspace.mode}
        sessionEmail={workspace.sessionEmail}
        onClose={handleCloseAuthDialog}
        onRefresh={workspace.refresh}
      />

      <FollowUpReminder onStartConsultation={handleResetChat} />

      {showOnboarding && <OnboardingFlow onComplete={() => { localStorage.setItem('onboarding_done', '1'); setShowOnboarding(false); const savedMode = localStorage.getItem('selected_guardian_mode') as ConsultationModeId | null; if (savedMode) setSelectedConsultationModeId(savedMode); }} />}
    </div>
    </GuardianThemeProvider>
  );
}
