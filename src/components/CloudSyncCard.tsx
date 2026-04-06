import { useEffect, useState } from 'react';
import { Cloud, LogIn, RefreshCw, Save } from 'lucide-react';
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

function getProfileCompletion(profile: ProfileDraft) {
  return (
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
    ) || 0
  );
}

export function CloudSyncCard({
  mode,
  statusLabel,
  profile,
  sessionEmail,
  onRefresh,
  isRefreshing = false,
  onSaveProfile,
  onApplyDemoPersona,
  onOpenAuth,
}: CloudSyncCardProps) {
  const [draft, setDraft] = useState<ProfileDraft>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'done' | 'error'>('idle');
  const [isApplyingPersona, setIsApplyingPersona] = useState<string | null>(null);
  const demoPersonas = getDemoPersonaSummaries();

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const isSignedIn = Boolean(sessionEmail);
  const isCloudConfigured = mode === 'cloud-ready' || mode === 'cloud-session';
  const profileCompletion = getProfileCompletion(draft);
  const syncBadgeLabel = isSignedIn
    ? '云端同步已开启'
    : isCloudConfigured
      ? '登录后可同步'
      : '当前浏览器保存';
  const syncBadgeClasses = isSignedIn
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : isCloudConfigured
      ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
      : 'border-slate-200 bg-slate-100 text-slate-700';

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

    try {
      await onApplyDemoPersona(personaId);
    } finally {
      setIsApplyingPersona(null);
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${syncBadgeClasses}`}
            >
              <Cloud size={12} />
              {syncBadgeLabel}
            </span>
            <p className="truncate text-sm font-semibold text-slate-900">
              {isSignedIn ? maskEmail(sessionEmail ?? '') : '游客模式'}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">{statusLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? '刷新中…' : '刷新状态'}
          </button>
        </div>
      </div>

      {!isSignedIn && onApplyDemoPersona && (
        <div className="border-b border-slate-100 py-4">
          <div className="flex flex-wrap gap-2">
            {demoPersonas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                disabled={Boolean(isApplyingPersona)}
                onClick={() => handleApplyPersona(persona.id)}
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplyingPersona === persona.id ? '载入中…' : persona.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-slate-100 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">健康档案</p>
            <p className="mt-1 text-xs text-slate-500">
              下次问诊会直接复用这些信息，减少重复追问。
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">完整度</p>
            <p className="text-sm font-semibold text-slate-900">{profileCompletion}%</p>
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-cyan-500 transition-all"
            style={{ width: `${Math.max(profileCompletion, 6)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">昵称</span>
            <input
              value={draft.displayName}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, displayName: event.target.value }))
              }
              placeholder="如：张三 / 妈妈"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">出生年份</span>
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
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">性别</span>
            <select
              value={draft.gender}
              onChange={(event) => setDraft((prev) => ({ ...prev, gender: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            >
              <option value="">暂不填写</option>
              <option value="女">女</option>
              <option value="男">男</option>
              <option value="其他/不便透露">其他/不便透露</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">常住城市</span>
            <input
              value={draft.city}
              onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="如：苏州"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">关注重点</span>
            <input
              value={draft.careFocus}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, careFocus: event.target.value }))
              }
              placeholder="如：今晚要不要去医院"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">慢病 / 既往史</span>
            <textarea
              value={draft.chronicConditions}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, chronicConditions: event.target.value }))
              }
              rows={3}
              placeholder="如：高血压、糖尿病、哮喘"
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">过敏史</span>
            <textarea
              value={draft.allergies}
              onChange={(event) => setDraft((prev) => ({ ...prev, allergies: event.target.value }))}
              rows={3}
              placeholder="如：青霉素、海鲜、花粉"
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">当前用药</span>
            <textarea
              value={draft.currentMedications}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, currentMedications: event.target.value }))
              }
              rows={3}
              placeholder="如：阿司匹林、二甲双胍"
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">其他备注</span>
            <textarea
              value={draft.medicalNotes}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, medicalNotes: event.target.value }))
              }
              rows={3}
              placeholder="如：最近睡眠差、家里有老人小孩"
              className="resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-300"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-[20px] text-xs">
          {saveState === 'done' && (
            <p className="text-emerald-600">已保存，下次问诊会自动带上这些信息。</p>
          )}
          {saveState === 'error' && <p className="text-rose-600">保存失败，请稍后重试。</p>}
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={!onSaveProfile || isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Save size={14} />
          {isSaving ? '保存中…' : '保存档案'}
        </button>
      </div>
    </section>
  );
}
