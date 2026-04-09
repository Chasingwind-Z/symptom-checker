import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Cloud,
  FileDown,
  FileText,
  LogIn,
  MapPin,
  MessageSquareText,
  Pill,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { SidebarSection } from './AppSidebar';
import type { CaseHistoryItem, HealthWorkspaceSnapshot, ProfileDraft } from '../lib/healthData';
import {
  buildHealthDigest,
  buildHealthTimeline,
  buildNearbyPharmacyUrl,
  buildWorkspaceShareText,
  type HouseholdProfileRecord,
} from '../lib/healthWorkspaceInsights';
import { getDemoPersonaSummaries } from '../lib/personalization';
import { getRiskPresentation } from '../lib/riskPresentation';
import { maskEmail } from '../lib/supabase';

interface CloudSyncCardProps {
  mode: HealthWorkspaceSnapshot['mode'];
  statusLabel: string;
  helperText: string;
  recentCases: CaseHistoryItem[];
  profile: ProfileDraft;
  householdProfiles?: HouseholdProfileRecord[];
  reportCount?: number;
  sessionEmail: string | null;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  onSaveProfile?: (patch: Partial<ProfileDraft>) => Promise<unknown>;
  onApplyDemoPersona?: (personaId: string) => Promise<unknown>;
  onSaveHouseholdProfile?: (input: {
    id?: string;
    label: string;
    relationship: string;
    profile: ProfileDraft;
  }) => Promise<HouseholdProfileRecord[]> | HouseholdProfileRecord[];
  onRemoveHouseholdProfile?: (id: string) => Promise<HouseholdProfileRecord[]> | HouseholdProfileRecord[];
  onOpenWorkspaceSection?: (section: SidebarSection) => void;
  onOpenAuth?: () => void;
}

type FeedbackState = {
  tone: 'success' | 'error';
  message: string;
};

type LucideIcon = ComponentType<{ size?: number; className?: string }>;

const TIMELINE_DOT_TONE = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  orange: 'bg-orange-500',
  red: 'bg-rose-500',
  slate: 'bg-slate-400',
} as const;

function formatDateTimeLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '刚刚';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function trimText(text: string, maxLength = 88) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function getAgeLabel(birthYear: number | null) {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear;
  if (age <= 0 || age > 120) return null;
  return `${age} 岁`;
}

function getRelationshipLabel(profile: ProfileDraft) {
  const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : null;
  const combinedText = [profile.displayName, profile.careFocus, profile.medicalNotes].join(' ');

  if (/(孩子|儿童|宝宝|婴儿|儿科)/.test(combinedText)) {
    return '儿童';
  }

  if (/(伴侣|爱人|丈夫|妻子|老公|老婆)/.test(combinedText)) {
    return '伴侣';
  }

  if (
    (age !== null && age >= 60) ||
    /(爸爸|妈妈|爷爷|奶奶|姥姥|姥爷|老人|长辈|阿姨|叔叔)/.test(combinedText)
  ) {
    return '长辈';
  }

  return '本人';
}

function getHouseholdLabel(profile: ProfileDraft) {
  const displayName = profile.displayName.trim();
  if (displayName) return displayName;

  const relationship = getRelationshipLabel(profile);
  return relationship === '本人' ? '本人档案' : `${relationship}档案`;
}

function getDominantDepartment(recentCases: CaseHistoryItem[]) {
  const counter = new Map<string, number>();
  recentCases.forEach((item) => {
    item.departments.forEach((department) => {
      counter.set(department, (counter.get(department) ?? 0) + 1);
    });
  });

  return Array.from(counter.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function buildNearbyClinicUrl(city: string, department?: string | null) {
  const normalizedCity = city.trim() && city !== '中国大陆' ? city.trim() : '';
  const keyword = normalizedCity
    ? `${normalizedCity} ${department ?? '全科'} 门诊`
    : department
      ? `${department} 门诊`
      : '附近医院';

  return `https://uri.amap.com/search?keyword=${encodeURIComponent(
    keyword
  )}&src=symptom-checker&coordinate=gaode&callnative=1`;
}

function getProfileHighlights(profile: ProfileDraft) {
  return [
    getRelationshipLabel(profile),
    getAgeLabel(profile.birthYear),
    profile.gender || null,
    profile.city && profile.city !== '中国大陆' ? profile.city : null,
    profile.chronicConditions ? `慢病：${trimText(profile.chronicConditions, 14)}` : null,
  ].filter(Boolean) as string[];
}

function getHouseholdSummary(record: HouseholdProfileRecord) {
  const highlights = [
    record.relationship,
    ...getProfileHighlights(record.profile).filter((item) => item !== record.relationship),
    record.profile.careFocus ? `关注：${trimText(record.profile.careFocus, 16)}` : null,
  ].filter(Boolean);

  return highlights.slice(0, 4).join(' · ') || '暂未补充更多背景';
}

function getFeedbackTextClass(tone: FeedbackState['tone']) {
  return tone === 'success' ? 'text-emerald-600' : 'text-rose-600';
}

function SectionCard({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ShortcutTile({
  label,
  description,
  icon: Icon,
  href,
  onClick,
  toneClass = 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/60',
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  toneClass?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Icon size={16} />
        </div>
        <ArrowRight size={14} className="mt-1 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`rounded-2xl border p-3 text-left transition-all hover:shadow-sm ${toneClass}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition-all hover:shadow-sm ${toneClass}`}
    >
      {content}
    </button>
  );
}

function FeedbackHint({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) return null;
  return <p className={`mt-3 text-xs ${getFeedbackTextClass(feedback.tone)}`}>{feedback.message}</p>;
}

export function CloudSyncCard({
  mode,
  statusLabel,
  helperText,
  recentCases,
  profile,
  householdProfiles = [],
  reportCount = 0,
  sessionEmail,
  onRefresh,
  isRefreshing = false,
  onSaveProfile,
  onApplyDemoPersona,
  onSaveHouseholdProfile,
  onRemoveHouseholdProfile,
  onOpenWorkspaceSection,
  onOpenAuth,
}: CloudSyncCardProps) {
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'done' | 'error'>('idle');
  const [isApplyingPersona, setIsApplyingPersona] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(profile.profileMode === 'demo');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [isSavingHousehold, setIsSavingHousehold] = useState(false);
  const [isRemovingHouseholdId, setIsRemovingHouseholdId] = useState<string | null>(null);
  const [householdFeedback, setHouseholdFeedback] = useState<FeedbackState | null>(null);
  const [reportFeedback, setReportFeedback] = useState<FeedbackState | null>(null);
  const demoPersonas = getDemoPersonaSummaries();
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setDraft(profile);
    if (profile.profileMode === 'demo') {
      setIsEditorOpen(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!selectedHouseholdId || householdProfiles.some((record) => record.id === selectedHouseholdId)) {
      return;
    }
    setSelectedHouseholdId(null);
  }, [householdProfiles, selectedHouseholdId]);

  useEffect(() => {
    if (!householdFeedback) return;
    const timeoutId = window.setTimeout(() => setHouseholdFeedback(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [householdFeedback]);

  useEffect(() => {
    if (!reportFeedback) return;
    const timeoutId = window.setTimeout(() => setReportFeedback(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [reportFeedback]);

  const isSignedIn = Boolean(sessionEmail);
  const isCloudConfigured = mode === 'cloud-ready' || mode === 'cloud-session';
  const timelineEntries= useMemo(() => buildHealthTimeline(recentCases), [recentCases]);
  const digest = useMemo(
    () => buildHealthDigest(recentCases, recentCases.length >= 3 ? 'month' : 'week'),
    [recentCases]
  );
  const recentCaseMap = useMemo(
    () => new Map(recentCases.map((item) => [item.id, item] as const)),
    [recentCases]
  );
  const dominantDepartment = useMemo(() => getDominantDepartment(recentCases), [recentCases]);
  const currentAgeLabel = getAgeLabel(draft.birthYear);
  const currentRelationshipLabel = getRelationshipLabel(draft);
  const currentProfileLabel = draft.displayName.trim() || '未命名档案';
  const profileOneLiner = [
    currentAgeLabel,
    draft.gender || null,
    draft.allergies ? `过敏:${trimText(draft.allergies, 12)}` : null,
    draft.chronicConditions ? `慢病:${trimText(draft.chronicConditions, 12)}` : null,
  ].filter(Boolean).join(' · ') || '尚未填写基础信息';
  const nearbyPharmacyUrl = useMemo(() => buildNearbyPharmacyUrl(draft.city), [draft.city]);
  const nearbyClinicUrl = useMemo(
    () => buildNearbyClinicUrl(draft.city, dominantDepartment),
    [draft.city, dominantDepartment]
  );
  const workspaceShareText = useMemo(
    () =>
      buildWorkspaceShareText({
        profile: draft,
        recentCases,
        householdCount: householdProfiles.length,
      }),
    [draft, householdProfiles.length, recentCases]
  );
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(profile),
    [draft, profile]
  );
  const currentHouseholdRecord =
    householdProfiles.find((record) => record.id === selectedHouseholdId) ?? null;
  const syncBadgeLabel = isSignedIn
    ? '云端同步已开启'
    : '仅本地保存';
  const syncBadgeClasses = isSignedIn
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isCloudConfigured
      ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

  function updateDraft(patch: Partial<ProfileDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState('idle');
  }

  async function handleSaveProfile() {
    if (!onSaveProfile) return;

    setIsSaving(true);
    setSaveState('idle');

    try {
      await onSaveProfile(draft);
      setSaveState('done');
    } catch {
      setSaveState('error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApplyPersona(personaId: string) {
    if (!onApplyDemoPersona) return;

    setIsApplyingPersona(personaId);
    setSelectedHouseholdId(null);
    setSaveState('idle');

    try {
      await onApplyDemoPersona(personaId);
      setHouseholdFeedback({
        tone: 'success',
        message: '模板已载入。你可以先核对资料，再保存成自己的长期档案。',
      });
      setIsEditorOpen(true);
    } finally {
      setIsApplyingPersona(null);
    }
  }

  async function handleSaveCurrentAsHousehold() {
    if (!onSaveHouseholdProfile) return;

    const label = getHouseholdLabel(draft);
    const relationship = getRelationshipLabel(draft);
    const matchedRecord =
      householdProfiles.find((record) => record.id === selectedHouseholdId) ??
      householdProfiles.find((record) => record.label === label && record.relationship === relationship);

    setIsSavingHousehold(true);

    try {
      const nextProfiles = await onSaveHouseholdProfile({
        id: matchedRecord?.id,
        label,
        relationship,
        profile: draft,
      });
      const resolvedRecord =
        nextProfiles.find((record) => record.id === matchedRecord?.id) ??
        nextProfiles.find((record) => record.label === label && record.relationship === relationship);

      setSelectedHouseholdId(resolvedRecord?.id ?? matchedRecord?.id ?? null);
      setHouseholdFeedback({
        tone: 'success',
        message: matchedRecord ? `已更新 ${label} 的家庭档案。` : `已把当前档案保存为“${label}”。`,
      });
    } catch {
      setHouseholdFeedback({
        tone: 'error',
        message: '家庭档案保存失败，请稍后重试。',
      });
    } finally {
      setIsSavingHousehold(false);
    }
  }

  function handleLoadHouseholdProfile(record: HouseholdProfileRecord) {
    setDraft(record.profile);
    setSelectedHouseholdId(record.id);
    setSaveState('idle');
    setIsEditorOpen(true);
    setHouseholdFeedback({
      tone: 'success',
      message: `已载入 ${record.label}。保存后会作为当前问诊使用的档案。`,
    });
  }

  async function handleRemoveHouseholdProfile(record: HouseholdProfileRecord) {
    if (!onRemoveHouseholdProfile) return;

    setIsRemovingHouseholdId(record.id);

    try {
      await onRemoveHouseholdProfile(record.id);
      if (selectedHouseholdId === record.id) {
        setSelectedHouseholdId(null);
      }
      setHouseholdFeedback({
        tone: 'success',
        message: `已移除 ${record.label}。`,
      });
    } catch {
      setHouseholdFeedback({
        tone: 'error',
        message: '移除家庭档案失败，请稍后重试。',
      });
    } finally {
      setIsRemovingHouseholdId(null);
    }
  }

  async function handleCopyShareText() {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setReportFeedback({
        tone: 'error',
        message: '当前环境不支持复制，请改用下载摘要。',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(workspaceShareText);
      setReportFeedback({
        tone: 'success',
        message: '健康摘要已复制，可直接发给家人或分诊台。',
      });
    } catch {
      setReportFeedback({
        tone: 'error',
        message: '复制失败，请稍后再试。',
      });
    }
  }

  async function handleShareSummary() {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: '健康助手 · 个人健康摘要',
          text: workspaceShareText,
        });
        setReportFeedback({
          tone: 'success',
          message: '摘要已调起系统分享。',
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    await handleCopyShareText();
  }

  function handleDownloadSummary() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      setReportFeedback({
        tone: 'error',
        message: '当前环境不支持下载摘要。',
      });
      return;
    }

    try {
      const blob = new Blob([workspaceShareText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `健康档案摘要_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.txt`;

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setReportFeedback({
        tone: 'success',
        message: '健康摘要已下载到本地。',
      });
    } catch {
      setReportFeedback({
        tone: 'error',
        message: '下载失败，请稍后再试。',
      });
    }
  }

  const summaryChips = [
    `当前档案：${currentProfileLabel}`,
    currentRelationshipLabel,
    currentAgeLabel,
    draft.gender || null,
    draft.city && draft.city !== '中国大陆' ? draft.city : null,
    dominantDepartment ? `常见科室：${dominantDepartment}` : null,
  ].filter(Boolean) as string[];

  const accountHint = isSignedIn
    ? '资料与最近问诊会优先尝试跨设备同步'
    : '资料保存在当前浏览器';

  return (
    <section className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${syncBadgeClasses}`}
                >
                  <Cloud size={12} />
                  {syncBadgeLabel}
                </span>
                {draft.profileMode === 'demo' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    <Sparkles size={12} />
                    场景模板
                  </span>
                )}
                {reportCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <FileText size={12} />
                    已导出 {reportCount} 份报告
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-slate-900">个人档案{currentProfileLabel !== '未命名档案' ? ` · ${currentProfileLabel}` : ''}</h2>
                  <p className="mt-1 text-sm text-slate-600">{profileOneLiner}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{statusLabel} — {helperText}</p>
                </div>

                <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">当前账号</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                    {isSignedIn ? maskEmail(sessionEmail ?? '') : '本地模式'}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{accountHint}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {summaryChips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    isSignedIn
                      ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                  }`}
                >
                  <LogIn size={14} />
                  {isSignedIn ? '管理账号' : '登录后同步'}
                </button>
              )}

              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? '刷新中…' : '刷新状态'}
              </button>
            </div>
          </div>

          {onOpenWorkspaceSection && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenWorkspaceSection('records')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <MessageSquareText size={14} />
                历史会话
              </button>
              <button
                type="button"
                onClick={() => onOpenWorkspaceSection('records')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <ClipboardList size={14} />
                记录中心
              </button>
              <button
                type="button"
                onClick={() => onOpenWorkspaceSection('records')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pill size={14} />
                用药参考
              </button>
            </div>
          )}

        </section>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <SectionCard
              title="近期健康动态"
              description="把最近问诊按时间线整理出来，方便你快速回顾主诉、风险和下一步动作。"
              action={
                onOpenWorkspaceSection ? (
                  <button
                    type="button"
                    onClick={() => onOpenWorkspaceSection('records')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 transition-colors hover:text-cyan-800"
                  >
                    查看全部
                    <ArrowRight size={13} />
                  </button>
                ) : undefined
              }
            >
              {timelineEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm leading-relaxed text-slate-500">
                  还没有近期健康动态。完成一次问诊后，这里会自动显示时间、风险等级、摘要和常见科室。
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEntries.slice(0, 4).map((item, index, visibleEntries) => {
                    const riskMeta = getRiskPresentation(recentCaseMap.get(item.id)?.triageLevel ?? null);
                    return (
                      <div key={item.id} className="relative pl-5">
                        {index < visibleEntries.length - 1 && (
                          <span className="absolute left-[4px] top-5 h-[calc(100%-0.25rem)] w-px bg-slate-200" />
                        )}
                        <span
                          className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ${
                            TIMELINE_DOT_TONE[item.tone]
                          }`}
                        />

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {trimText(item.title, 28)}
                                </p>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}
                                >
                                  {riskMeta.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                              {item.statusLabel}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            {trimText(item.summary, 92)}
                          </p>

                          {item.departments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.departments.slice(0, 3).map((department) => (
                                <span
                                  key={department}
                                  className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-500"
                                >
                                  {department}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="档案编辑"
              description="平时可以先看上方看板；需要改资料时再展开，不再把整个页面都做成长表单。"
              action={
                <button
                  type="button"
                  onClick={() => setIsEditorOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {isEditorOpen ? '收起编辑' : '展开编辑'}
                  <ChevronDown size={14} className={isEditorOpen ? 'rotate-180' : ''} />
                </button>
              }
            >
              <div className="flex flex-wrap gap-2">
                {summaryChips.slice(0, 5).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
                {currentHouseholdRecord && (
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    来自家庭档案：{currentHouseholdRecord.label}
                  </span>
                )}
                {hasUnsavedChanges && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    有未保存修改
                  </span>
                )}
              </div>

              {isEditorOpen && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">基础信息</p>
                      <p className="mt-1 text-xs text-slate-500">
                        用来调整追问语气、年龄风险判断和线下就诊建议。
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">昵称</span>
                          <input
                            value={draft.displayName}
                            onChange={(event) => updateDraft({ displayName: event.target.value })}
                            placeholder="如：张三 / 妈妈"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">出生年份</span>
                          <input
                            type="number"
                            value={draft.birthYear ?? ''}
                            onChange={(event) =>
                              updateDraft({
                                birthYear: event.target.value ? Number(event.target.value) : null,
                              })
                            }
                            placeholder="如：1995"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">性别</span>
                          <select
                            value={draft.gender}
                            onChange={(event) => updateDraft({ gender: event.target.value })}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          >
                            <option value="">暂不填写</option>
                            <option value="女">女</option>
                            <option value="男">男</option>
                            <option value="其他/不便透露">其他/不便透露</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 sm:col-span-2">
                          <span className="text-xs font-medium text-slate-500">常住城市</span>
                          <input
                            value={draft.city}
                            onChange={(event) => updateDraft({ city: event.target.value })}
                            placeholder="如：苏州"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">病史与用药</p>
                      <p className="mt-1 text-xs text-slate-500">
                        这是后续风险提示和 OTC / 家庭处理筛选时最关键的背景。
                      </p>

                      <div className="mt-3 space-y-3">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">慢病 / 既往史</span>
                          <textarea
                            value={draft.chronicConditions}
                            onChange={(event) =>
                              updateDraft({ chronicConditions: event.target.value })
                            }
                            rows={3}
                            placeholder="如：高血压、糖尿病、哮喘"
                            className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">过敏史</span>
                          <textarea
                            value={draft.allergies}
                            onChange={(event) => updateDraft({ allergies: event.target.value })}
                            rows={3}
                            placeholder="如：青霉素、海鲜、花粉"
                            className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500">当前用药</span>
                          <textarea
                            value={draft.currentMedications}
                            onChange={(event) =>
                              updateDraft({ currentMedications: event.target.value })
                            }
                            rows={3}
                            placeholder="如：阿司匹林、二甲双胍"
                            className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">这次更关心什么</p>
                    <p className="mt-1 text-xs text-slate-500">
                      例如“今晚要不要去医院”“是否适合家人陪同”“担心和慢病叠加”等。
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">关注重点</span>
                        <input
                          value={draft.careFocus}
                          onChange={(event) => updateDraft({ careFocus: event.target.value })}
                          placeholder="如：今晚要不要去医院"
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">其他备注</span>
                        <textarea
                          value={draft.medicalNotes}
                          onChange={(event) => updateDraft({ medicalNotes: event.target.value })}
                          rows={4}
                          placeholder="如：最近睡眠差、家里有老人小孩、近期体检异常"
                          className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-h-[20px] text-xs">
                      {saveState === 'done' && (
                        <p className="text-emerald-600">已保存，下次问诊会自动带上这些信息。</p>
                      )}
                      {saveState === 'error' && (
                        <p className="text-rose-600">保存失败，请稍后重试。</p>
                      )}
                      {saveState === 'idle' && hasUnsavedChanges && (
                        <p className="text-slate-500">当前有未保存修改，确认后再保存即可。</p>
                      )}
                      {saveState === 'idle' && !hasUnsavedChanges && (
                        <p className="text-slate-500">当前看板已和档案保持一致。</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={!onSaveProfile || isSaving || !hasUnsavedChanges}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Save size={14} />
                      {isSaving ? '保存中…' : '保存当前档案'}
                    </button>
                  </div>

                  {!isSignedIn && onApplyDemoPersona && (
                    <div className="border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowTemplates((prev) => !prev)}
                        className="text-xs text-slate-500 hover:text-cyan-700 transition-colors"
                      >
                        {showTemplates ? '收起模板 ↑' : '快速填充模板数据 →'}
                      </button>
                      {showTemplates && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {demoPersonas.map((persona) => (
                            <button
                              key={persona.id}
                              type="button"
                              disabled={Boolean(isApplyingPersona)}
                              onClick={() => void handleApplyPersona(persona.id)}
                              className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isApplyingPersona === persona.id ? '载入中…' : persona.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard
              title="家庭成员与常用档案"
              description="先把常用家人资料存在这个设备里，需要时一键载入到当前问诊档案。"
              action={
                onSaveHouseholdProfile ? (
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsHousehold}
                    disabled={isSavingHousehold}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Users size={14} />
                    {isSavingHousehold
                      ? '保存中…'
                      : selectedHouseholdId
                        ? '更新家庭档案'
                        : '保存为家庭档案'}
                  </button>
                ) : undefined
              }
            >
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-cyan-700">当前生效档案</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{currentProfileLabel}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {draft.careFocus
                        ? `当前关注：${trimText(draft.careFocus, 42)}`
                        : '这份档案会直接影响下一次问诊的追问和建议。'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-xs font-medium text-cyan-700">
                      {currentRelationshipLabel}
                    </span>
                    {currentAgeLabel && (
                      <span className="rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-xs font-medium text-cyan-700">
                        {currentAgeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {householdProfiles.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  还没有保存家庭成员档案。把当前资料保存为家庭档案后，之后可以一键切换到儿童、长辈或伴侣场景。
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {householdProfiles.map((record) => (
                    <div
                      key={record.id}
                      className={`rounded-2xl border p-3 ${
                        selectedHouseholdId === record.id
                          ? 'border-cyan-200 bg-cyan-50/60'
                          : 'border-slate-100 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{record.label}</p>
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                              {record.relationship}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">
                            {getHouseholdSummary(record)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDateTimeLabel(record.updatedAt)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadHouseholdProfile(record)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          载入当前档案
                        </button>
                        {onRemoveHouseholdProfile && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveHouseholdProfile(record)}
                            disabled={isRemovingHouseholdId === record.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isRemovingHouseholdId === record.id ? '移除中…' : '移除'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSignedIn && (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
                  当前家庭档案先保存在本设备里，避免做半成品云端多成员承诺；后续版本再补齐共享和协作同步。
                </div>
              )}

              <FeedbackHint feedback={householdFeedback} />
            </SectionCard>

            <SectionCard
              title="档案摘要与分享"
              description="适合发给家人、门诊分诊台，或作为下一次复诊时的开场说明。"
              action={
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {reportCount > 0 ? `PDF 报告 ${reportCount} 份` : '文字摘要可直接分享'}
                </span>
              }
            >
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="mt-0.5 text-cyan-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{digest.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{digest.summary}</p>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {digest.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                      <ShieldCheck size={13} className="mt-0.5 text-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleCopyShareText()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <ClipboardList size={14} />
                  复制摘要
                </button>
                <button
                  type="button"
                  onClick={() => void handleShareSummary()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Share2 size={14} />
                  系统分享
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSummary}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <FileDown size={14} />
                  下载文本
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                更正式的 PDF 问诊报告仍可在单次问诊结果页导出；这里先提供更适合转发和交接的轻量摘要。
              </p>

              <FeedbackHint feedback={reportFeedback} />
            </SectionCard>

            <SectionCard
              title="服务入口"
              description="把接下来更常用的动作集中在一处：继续看记录、查药房、找合适门诊。"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {onOpenWorkspaceSection && (
                  <ShortcutTile
                    label="用药与家庭处理"
                    description="根据慢病、过敏和最近记录，查看更保守的 OTC / 家庭处理方向。"
                    icon={Pill}
                    onClick={() => onOpenWorkspaceSection('records')}
                    toneClass="border-cyan-100 bg-cyan-50/50 hover:border-cyan-200 hover:bg-cyan-50"
                  />
                )}
                {onOpenWorkspaceSection && (
                  <ShortcutTile
                    label="记录中心"
                    description="回看待跟进项目、最近摘要和继续咨询入口。"
                    icon={ClipboardList}
                    onClick={() => onOpenWorkspaceSection('records')}
                    toneClass="border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  />
                )}
                <ShortcutTile
                  label="附近药房"
                  description="需要先买常见 OTC 或补家庭药箱时，可以从这里直接搜。"
                  icon={MapPin}
                  href={nearbyPharmacyUrl}
                  toneClass="border-emerald-100 bg-emerald-50/50 hover:border-emerald-200 hover:bg-emerald-50"
                />
                <ShortcutTile
                  label={dominantDepartment ? `${dominantDepartment} 门诊` : '附近医院'}
                  description={
                    dominantDepartment
                      ? `优先按最近最常出现的科室方向检索线下入口。`
                      : '还没有形成稳定科室偏好时，先从附近医院入口开始。'
                  }
                  icon={Stethoscope}
                  href={nearbyClinicUrl}
                  toneClass="border-violet-100 bg-violet-50/50 hover:border-violet-200 hover:bg-violet-50"
                />
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
