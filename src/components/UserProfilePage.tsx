import { useState } from 'react';
import { ArrowLeft, Check, User } from 'lucide-react';
import type { ProfileDraft } from '../lib/healthData';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-cyan-500',
  'from-purple-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-indigo-400 to-blue-500',
];

const GENDER_OPTIONS = ['男', '女', '其他', '不愿透露'];

interface UserProfilePageProps {
  profile: ProfileDraft;
  onSave: (updated: ProfileDraft) => void;
  onClose: () => void;
}

export function UserProfilePage({ profile, onSave, onClose }: UserProfilePageProps) {
  const [draft, setDraft] = useState<ProfileDraft>(() => ({ ...profile }));
  const [saved, setSaved] = useState(false);

  const gradientIndex = draft.avatarGradient ?? 0;
  const initial = draft.displayName.trim()
    ? draft.displayName.trim()[0].toUpperCase()
    : '';

  const handleField = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave({ ...draft, profileMode: 'custom' });
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">个人资料</h1>
      </div>

      {/* Avatar Section */}
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[gradientIndex]} text-3xl font-bold text-white shadow-md`}
          >
            {initial || <User size={32} />}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {AVATAR_GRADIENTS.map((g, i) => (
              <button
                key={g}
                type="button"
                onClick={() => handleField('avatarGradient', i)}
                className={`h-8 w-8 rounded-full bg-gradient-to-br ${g} transition-all ${
                  i === gradientIndex
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                    : 'opacity-70 hover:opacity-100'
                }`}
                aria-label={`选择渐变色 ${i + 1}`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400">点击选择头像渐变色</p>
        </div>
      </section>

      {/* Basic Info */}
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">基本信息</h2>
        <div className="grid gap-3">
          <FieldRow label="昵称">
            <input
              type="text"
              value={draft.displayName}
              onChange={(e) => handleField('displayName', e.target.value)}
              placeholder="请输入昵称"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="城市">
            <input
              type="text"
              value={draft.city}
              onChange={(e) => handleField('city', e.target.value)}
              placeholder="请输入城市"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="出生年份">
            <input
              type="number"
              value={draft.birthYear ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                handleField('birthYear', v === '' ? null : Number(v));
              }}
              placeholder="例如 1990"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="性别">
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleField('gender', g)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    draft.gender === g
                      ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
      </section>

      {/* Health Profile */}
      <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">健康档案</h2>
        <div className="grid gap-3">
          <FieldRow label="慢性疾病">
            <input
              type="text"
              value={draft.chronicConditions}
              onChange={(e) => handleField('chronicConditions', e.target.value)}
              placeholder="如高血压、糖尿病等，多个用逗号分隔"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="过敏信息">
            <input
              type="text"
              value={draft.allergies}
              onChange={(e) => handleField('allergies', e.target.value)}
              placeholder="如青霉素、花粉等"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="当前用药">
            <input
              type="text"
              value={draft.currentMedications}
              onChange={(e) => handleField('currentMedications', e.target.value)}
              placeholder="正在服用的药物"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
            />
          </FieldRow>

          <FieldRow label="备注">
            <textarea
              value={draft.medicalNotes}
              onChange={(e) => handleField('medicalNotes', e.target.value)}
              placeholder="其他健康相关备注"
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors resize-none"
            />
          </FieldRow>
        </div>
      </section>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        className={`w-full rounded-2xl py-3 text-sm font-semibold shadow-sm transition-all ${
          saved
            ? 'bg-emerald-500 text-white'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {saved ? <><Check size={16} /> 已保存</> : '保存资料'}
        </span>
      </button>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <label className="mb-1.5 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
