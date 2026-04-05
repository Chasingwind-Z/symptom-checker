import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Cloud,
  Database,
  History,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import type { CaseHistoryItem, HealthWorkspaceSnapshot, ProfileDraft } from '../lib/healthData';
import { sendMagicLink, signOutSupabase } from '../lib/supabase';

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
}

const TRIAGE_LABELS: Record<CaseHistoryItem['triageLevel'], string> = {
  green: '绿色 · 居家观察',
  yellow: '黄色 · 建议就医',
  orange: '橙色 · 今日处理',
  red: '红色 · 立即急诊',
  pending: '待分诊',
};

const TRIAGE_BADGES: Record<CaseHistoryItem['triageLevel'], string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 border-amber-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
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
}: CloudSyncCardProps) {
  const latestCase = recentCases[0];
  const [isExpanded, setIsExpanded] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'done' | 'error'>('idle');
  const [authEmail, setAuthEmail] = useState(sessionEmail ?? '');
  const [authState, setAuthState] = useState<{ kind: 'idle' | 'success' | 'error'; message: string }>({
    kind: 'idle',
    message: '',
  });
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    setAuthEmail(sessionEmail ?? '');
  }, [sessionEmail]);

  const hasProfileInfo = Boolean(
    profile.displayName || profile.birthYear || profile.gender || profile.medicalNotes
  );
  const profileCompletion =
    Math.round(
      ([
        profile.displayName,
        profile.city,
        profile.birthYear,
        profile.gender,
        profile.medicalNotes,
      ].filter(Boolean).length /
        5) *
        100
    ) || 0;
  const cloudCaseCount = recentCases.filter((item) => item.source === 'supabase').length;
  const localCaseCount = recentCases.length - cloudCaseCount;
  const isCloudConfigured = mode === 'cloud-ready' || mode === 'cloud-session';
  const isSignedIn = Boolean(sessionEmail);

  async function handleSendMagicLink() {
    setIsSendingMagicLink(true);
    const result = await sendMagicLink(authEmail);
    setAuthState({
      kind: result.ok ? 'success' : 'error',
      message: result.message,
    });
    setIsSendingMagicLink(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const result = await signOutSupabase();
    setAuthState({
      kind: result.ok ? 'success' : 'error',
      message: result.message,
    });
    setIsSigningOut(false);
    await Promise.resolve(onRefresh());
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

  return (
    <section className="mb-4 rounded-2xl border border-cyan-100 bg-white/90 backdrop-blur px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 mb-2 ${
              isSignedIn
                ? 'border-emerald-100 bg-emerald-50'
                : isCloudConfigured
                  ? 'border-cyan-100 bg-cyan-50'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            <Cloud size={13} className="text-cyan-600" />
            <span
              className={`text-[11px] font-semibold ${
                isSignedIn
                  ? 'text-emerald-700'
                  : isCloudConfigured
                    ? 'text-cyan-700'
                    : 'text-slate-700'
              }`}
            >
              {isSignedIn ? '已开启同步' : isCloudConfigured ? '登录后可同步' : '游客模式'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">我的健康空间</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{helperText}</p>
        </div>
        <div className="flex items-center gap-2">
          {sessionEmail && (
            <span className="hidden sm:inline-flex max-w-[220px] truncate rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              {sessionEmail}
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
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {sessionEmail || (isCloudConfigured ? '未登录，可邮件同步' : '当前为游客模式')}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isSignedIn ? '档案与历史可跨设备同步' : isCloudConfigured ? '可发送邮箱登录链接' : '可直接开始问诊，结果会先保存在本机'}
            </p>
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
            {profile.city || '中国大陆'} · {profile.gender || '待补充资料'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <History size={12} />
            最近历史
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-2">{recentCases.length} 条</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {latestCase
              ? `${latestCase.chiefComplaint} · ${TRIAGE_LABELS[latestCase.triageLevel]}`
              : '完成一次分诊后，这里会自动缓存本机/云端摘要。'}
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
                    默认使用邮箱 magic link，无需额外记密码；登录后档案和问诊摘要会自动尝试同步。
                  </p>
                </div>
                <ShieldCheck size={16} className="text-cyan-600" />
              </div>

              {isSignedIn ? (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-white/80 px-3 py-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-medium text-slate-800">当前账号</p>
                      <p className="text-[11px] text-slate-500 mt-1">{sessionEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      <LogOut size={13} />
                      {isSigningOut ? '退出中…' : '退出登录'}
                    </button>
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
                  <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                    邮箱登录（magic link）
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(event) => setAuthEmail(event.target.value)}
                        placeholder="请输入常用邮箱，如 name@example.com"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
                      />
                      <button
                        type="button"
                        onClick={handleSendMagicLink}
                        disabled={isSendingMagicLink}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors"
                      >
                        <Mail size={13} />
                        {isSendingMagicLink ? '发送中…' : '发送登录链接'}
                      </button>
                    </div>
                  </label>
                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    首次使用请在 Supabase Auth → URL Configuration 中加入当前站点地址，例如
                    {' '}
                    <span className="font-medium text-slate-700">http://localhost:5173</span>
                    。
                  </p>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-3 text-[11px] text-slate-600 leading-relaxed">
                  <p className="font-medium text-slate-800">要开启登录与同步，只需补 3 步：</p>
                  <ul className="mt-2 space-y-1 list-disc pl-4">
                    <li>在 `.env` 填写 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。</li>
                    <li>在 Supabase Auth 中启用 Email provider，并添加本地/线上 redirect URL。</li>
                    <li>执行现有 migration，让 `profiles`、`cases`、`case_messages` 表可用。</li>
                  </ul>
                </div>
              )}

              {authState.kind !== 'idle' && (
                <p
                  className={`mt-2 text-[11px] ${
                    authState.kind === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {authState.message}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-slate-800">我的健康档案</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    这些信息会被 Memory Agent 用来减少重复追问、提升个性化建议。
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
                慢病 / 过敏 / 备注
                <textarea
                  value={draft.medicalNotes}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, medicalNotes: event.target.value }))
                  }
                  rows={3}
                  placeholder="如：高血压、糖尿病、青霉素过敏"
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
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">最近问诊记录</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    已完成的分诊会自动缓存到本机或同步到云端。
                  </p>
                </div>
                {latestCase && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">
                    最新：{new Date(latestCase.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {recentCases.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-3 text-[11px] text-slate-500 leading-relaxed">
                    还没有历史记录。完成一次问诊后，这里会显示风险等级、建议科室和摘要。
                  </div>
                ) : (
                  recentCases.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          {item.chiefComplaint}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            TRIAGE_BADGES[item.triageLevel]
                          }`}
                        >
                          {TRIAGE_LABELS[item.triageLevel].split(' · ')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {new Date(item.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {item.source === 'supabase' ? '云端' : '本机'}
                      </p>
                      {item.departments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.departments.slice(0, 3).map((department) => (
                            <span
                              key={`${item.id}-${department}`}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                            >
                              {department}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {item.assistantPreview}
                      </p>
                    </div>
                  ))
                )}
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
                <li>• 未配置 Supabase 时，依然保留本机缓存，不影响继续使用</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
