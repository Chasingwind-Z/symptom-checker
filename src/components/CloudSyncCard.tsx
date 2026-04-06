import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Cloud,
  Database,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import type { CaseHistoryItem, HealthWorkspaceSnapshot, ProfileDraft } from '../lib/healthData';
import { getDemoPersonaSummaries } from '../lib/personalization';
import { maskEmail } from '../lib/supabase';

interface CloudSyncCardProps {
  mode: HealthWorkspaceSnapshot['mode'];
  statusLabel: string;
  helperText: string;
  recentCases: CaseHistoryItem[];
  profile: ProfileDraft;
  sessionEmail: string | null;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  onSaveProfile?: (patch: Partial<ProfileDraft>) => Promise<unknown>;
  onApplyDemoPersona?: (personaId: string) => Promise<unknown>;
  onOpenAuth?: () => void;
}

const TRIAGE_LABELS: Record<CaseHistoryItem['triageLevel'], string> = {
  green: '绿色 · 居家观察',
  yellow: '黄色 · 建议就医',
  orange: '橙色 · 今日处理',
  red: '红色 · 立即急诊',
  pending: '待分诊',
};

export function CloudSyncCard({
  mode,
  statusLabel,
  helperText,
  recentCases,
  profile,
  sessionEmail,
  onRefresh,
  isRefreshing = false,
  onSaveProfile,
  onApplyDemoPersona,
  onOpenAuth,
}: CloudSyncCardProps) {
  const latestCase = recentCases[0];
  const [isExpanded, setIsExpanded] = useState(true);
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'done' | 'error'>('idle');
  const [surfaceState, setSurfaceState] = useState<{
    kind: 'idle' | 'success' | 'error';
    message: string;
  }>({
    kind: 'idle',
    message: '',
  });
  const [isApplyingPersona, setIsApplyingPersona] = useState<string | null>(null);
  const demoPersonas = getDemoPersonaSummaries();

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const hasProfileInfo = Boolean(
    profile.displayName ||
      profile.birthYear ||
      profile.gender ||
      profile.medicalNotes ||
      profile.chronicConditions ||
      profile.allergies ||
      profile.currentMedications ||
      profile.careFocus
  );
  const profileCompletion =
    Math.round(
      ([
        profile.displayName,
        profile.city,
        profile.birthYear,
        profile.gender,
        profile.medicalNotes,
        profile.chronicConditions,
        profile.allergies,
        profile.currentMedications,
        profile.careFocus,
      ].filter(Boolean).length /
        9) *
        100
    ) || 0;
  const cloudCaseCount = recentCases.filter((item) => item.source === 'supabase').length;
  const localCaseCount = recentCases.length - cloudCaseCount;
  const isCloudConfigured = mode === 'cloud-ready' || mode === 'cloud-session';
  const isSignedIn = Boolean(sessionEmail);
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : '';
  const statusChipClasses = isSignedIn
    ? 'border-emerald-100 bg-emerald-50'
    : isCloudConfigured
      ? 'border-cyan-100 bg-cyan-50'
      : 'border-slate-200 bg-slate-50';
  const statusChipTextClasses = isSignedIn
    ? 'text-emerald-700'
    : isCloudConfigured
      ? 'text-cyan-700'
      : 'text-slate-700';
  const statusChipLabel = isSignedIn
    ? '云端同步已开启'
    : isCloudConfigured
      ? '登录后可跨设备同步'
      : '当前浏览器保存';
  const topHelperText = helperText;
  const accountHeadline = isSignedIn
    ? maskedSessionEmail || sessionEmail || '已登录'
    : isCloudConfigured
      ? '登录后可跨设备同步'
      : '仅当前浏览器保存';
  const accountHelper = isSignedIn
    ? '档案与问诊摘要会自动跨设备同步'
    : isCloudConfigured
      ? '使用专门的登录窗口完成邮箱登录、注册与同步'
      : '不影响直接问诊';

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
    const result = (await onApplyDemoPersona(personaId)) as
      | { ok?: boolean; helperText?: string; statusLabel?: string }
      | undefined;
    setSurfaceState({
      kind: result?.ok === false ? 'error' : 'success',
      message: result?.helperText ?? '常见场景资料已载入，可继续修改成自己的情况。',
    });
    setIsApplyingPersona(null);
  }

  return (
    <section className="mb-4 rounded-2xl border border-cyan-100 bg-white/90 backdrop-blur px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 mb-2 ${statusChipClasses}`}>
            <Cloud size={13} className="text-cyan-600" />
            <span className={`text-[11px] font-semibold ${statusChipTextClasses}`}>{statusChipLabel}</span>
          </div>
          <p className="text-sm font-semibold text-slate-800">健康空间</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{topHelperText}</p>
        </div>
        <div className="flex items-center gap-2">
          {sessionEmail && (
            <span className="hidden sm:inline-flex max-w-[220px] truncate rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              {maskedSessionEmail || sessionEmail}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {isExpanded ? '收起详情' : '查看详情'}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? '刷新中…' : '刷新状态'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 mt-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Database size={12} />
            当前状态
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-2">{statusLabel}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Mail size={12} />
            账号状态
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-2">{accountHeadline}</p>
          <p className="text-[11px] text-slate-500 mt-1">{accountHelper}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <UserRound size={12} />
            健康档案
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-2">
            {profile.displayName || (hasProfileInfo ? '资料待补全' : '未设置昵称')} · {profileCompletion}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {profile.city || '中国大陆'} ·{' '}
            {profile.chronicConditions || profile.gender || '待补充资料'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Clock size={12} />
            问诊摘要
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-2">{recentCases.length} 条</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {latestCase
              ? `${latestCase.chiefComplaint} · ${TRIAGE_LABELS[latestCase.triageLevel]}`
              : '完成一次分诊后，会自动缓存摘要并出现在下方历史会话里。'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
          云端同步 {cloudCaseCount} 条
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
          本机缓存 {localCaseCount} 条
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
          档案完整度 {profileCompletion}%
        </span>
      </div>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-3">
          <div className="space-y-3">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 px-3 py-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">账号与同步</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    登录注册已移到专门窗口；这里主要保留同步状态和档案本身，不再把登录表单塞在用户中心里。
                  </p>
                </div>
                <ShieldCheck size={16} className="text-cyan-600" />
              </div>

              {isSignedIn ? (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-white/80 px-3 py-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-slate-800">已连接邮箱</p>
                      <p className="text-[11px] text-slate-500 mt-1">{maskedSessionEmail || sessionEmail}</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        新的档案修改和最近问诊会自动尝试同步到云端。
                      </p>
                    </div>
                    {onOpenAuth && (
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        管理账号
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-emerald-50 px-2.5 py-2">
                      <p className="text-[10px] text-emerald-700">已同步记录</p>
                      <p className="text-sm font-semibold text-emerald-800 mt-1">{cloudCaseCount} 条</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-2.5 py-2">
                      <p className="text-[10px] text-slate-600">最近一条</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {latestCase ? TRIAGE_LABELS[latestCase.triageLevel].split(' · ')[0] : '暂无'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : isCloudConfigured ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 px-3 py-3">
                  <p className="text-sm font-medium text-slate-800">登录后可同步档案与记录</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    推荐使用邮箱链接或邮箱密码登录。登录注册已移到专门窗口里处理，不再打断档案编辑流程。
                  </p>
                  {onOpenAuth && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs text-white transition-colors hover:bg-cyan-700"
                      >
                        打开登录 / 注册窗口
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-3 text-[11px] text-slate-600 leading-relaxed">
                  即使暂未启用云端同步，也可以继续以游客模式使用；资料会保存在当前浏览器。
                </div>
              )}
            </div>

            {!isSignedIn && (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-3 py-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">快速载入常见场景</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      如果想先看看系统如何结合档案给出建议，可以先载入一组可编辑的常见场景资料。
                    </p>
                  </div>
                  <Sparkles size={16} className="text-violet-600" />
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {demoPersonas.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      disabled={Boolean(isApplyingPersona)}
                      onClick={() => handleApplyPersona(persona.id)}
                      className="rounded-2xl border border-violet-100 bg-white px-3 py-3 text-left hover:bg-violet-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <p className="text-xs font-semibold text-slate-800">{persona.label}</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {isApplyingPersona === persona.id ? '载入中…' : persona.subtitle}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {persona.tags.slice(0, 2).map((tag) => (
                          <span
                            key={`${persona.id}-${tag}`}
                            className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {surfaceState.kind !== 'idle' && (
              <p
                className={`rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
                  surfaceState.kind === 'success'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-rose-100 bg-rose-50 text-rose-700'
                }`}
              >
                {surfaceState.message}
              </p>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">我的健康档案</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      下次问诊会自动复用这些信息，减少重复追问，并过滤掉更不适合你的建议方向。
                    </p>
                  </div>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!onSaveProfile || isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors"
                >
                  <Save size={13} />
                  {isSaving ? '保存中…' : '保存档案'}
                </button>
              </div>

              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-cyan-500 transition-all"
                  style={{ width: profileCompletion === 0 ? '0%' : `${Math.max(profileCompletion, 6)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">资料完整度：{profileCompletion}%</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  昵称
                  <input
                    value={draft.displayName}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, displayName: event.target.value }))
                    }
                    placeholder="如：张三 / 爸爸"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  常驻城市
                  <input
                    value={draft.city}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, city: event.target.value }))
                    }
                    placeholder="如：苏州"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  出生年份
                  <input
                    type="number"
                    value={draft.birthYear ?? ''}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        birthYear: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                    placeholder="如：1995"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>

                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  性别
                  <select
                    value={draft.gender}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, gender: event.target.value }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                  >
                    <option value="">暂不填写</option>
                    <option value="女">女</option>
                    <option value="男">男</option>
                    <option value="其他/不便透露">其他/不便透露</option>
                  </select>
                </label>
              </div>

                <label className="mt-2.5 flex flex-col gap-1 text-[11px] text-slate-500">
                  慢病 / 既往史
                  <textarea
                    value={draft.chronicConditions}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, chronicConditions: event.target.value }))
                    }
                    rows={3}
                    placeholder="如：高血压、糖尿病、哮喘"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300 resize-none"
                  />
                </label>

                <label className="mt-2.5 flex flex-col gap-1 text-[11px] text-slate-500">
                  过敏史 / 当前用药
                  <textarea
                    value={`${draft.allergies}${draft.currentMedications ? `${draft.allergies ? '\n' : ''}${draft.currentMedications}` : ''}`}
                    onChange={(event) => {
                      const lines = event.target.value.split('\n');
                      setDraft((prev) => ({
                        ...prev,
                        allergies: lines[0] ?? '',
                        currentMedications: lines.slice(1).join('\n'),
                      }));
                    }}
                    rows={3}
                    placeholder="第一行写过敏史，如：青霉素；下面可写当前长期用药"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300 resize-none"
                  />
                </label>

                <label className="mt-2.5 flex flex-col gap-1 text-[11px] text-slate-500">
                  关注重点 / 本次更想解决什么
                  <textarea
                    value={draft.careFocus}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, careFocus: event.target.value }))
                    }
                    rows={2}
                    placeholder="如：我更想知道今晚需不需要去医院、哪些药适合我"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300 resize-none"
                  />
                </label>

                <label className="mt-2.5 flex flex-col gap-1 text-[11px] text-slate-500">
                  其他备注
                  <textarea
                    value={draft.medicalNotes}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, medicalNotes: event.target.value }))
                    }
                    rows={2}
                    placeholder="如：最近休息差、家里有孩子、担心交叉感染"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300 resize-none"
                  />
                </label>

              {saveState === 'done' && (
                <p className="mt-2 text-[11px] text-emerald-600">
                  已保存，下次问诊会直接带上这些信息。
                </p>
              )}
              {saveState === 'error' && (
                <p className="mt-2 text-[11px] text-rose-600">保存失败，请稍后重试。</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Database size={14} className="text-cyan-600" />
                <p className="text-sm font-semibold">当前保存位置</p>
              </div>
              <div className="mt-2 space-y-2 text-[11px] text-slate-600 leading-relaxed">
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="font-medium text-slate-700">游客模式</p>
                  <p className="mt-1">资料只保存在当前浏览器，适合先体验或临时使用。</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="font-medium text-slate-700">登录后</p>
                  <p className="mt-1">同一邮箱可跨设备同步档案、摘要和历史会话。</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-3 py-3">
              <div className="flex items-center gap-1.5 text-slate-700">
                <BadgeCheck size={14} className="text-cyan-600" />
                <p className="text-sm font-semibold">这次同步会带上什么？</p>
              </div>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                <li>• 你的昵称、城市、慢病/过敏备注</li>
                <li>• 最近问诊的风险等级、摘要与建议科室</li>
                <li>• 新的历史会话列表，可点击恢复并继续对话</li>
                <li>• 若云端暂不可用，也会保留浏览器本地缓存，不影响继续使用</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
