import { motion } from 'framer-motion';
import type { DiagnosisResult, Message, RiskLevel } from '../types';
import type { ProfileDraft } from '../lib/healthData';

interface VisitSummaryCardProps {
  result: DiagnosisResult;
  profile?: Partial<ProfileDraft> | null;
  messages: Message[];
  onClose: () => void;
}

const LEVEL_CONFIG: Record<RiskLevel, { emoji: string; label: string; bg: string }> = {
  green:  { emoji: '🟢', label: '低风险 · 居家观察',   bg: 'bg-emerald-50 text-emerald-800' },
  yellow: { emoji: '🟡', label: '中风险 · 建议就医',   bg: 'bg-amber-50 text-amber-800' },
  orange: { emoji: '🟠', label: '较高风险 · 今日就医', bg: 'bg-orange-50 text-orange-800' },
  red:    { emoji: '🔴', label: '紧急 · 立即急诊',     bg: 'bg-red-50 text-red-800' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-slate-500 mb-1">{title}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-600">
      <span className="text-slate-400 mr-1">{label}:</span>
      {value}
    </p>
  );
}

export function VisitSummaryCard({ result, profile, messages, onClose }: VisitSummaryCardProps) {
  const levelConfig = LEVEL_CONFIG[result.level];

  const userMessages = messages.filter((m) => m.role === 'user');
  const chiefComplaint = userMessages.length > 0
    ? userMessages[0].content.slice(0, 50)
    : '未提供';
  const symptomTimeline = userMessages
    .slice(0, 3)
    .map((m) => m.content.slice(0, 60))
    .join(' → ');

  const birthYearText = profile?.birthYear ? `${profile.birthYear}年生` : null;
  const hasProfileInfo = !!(
    birthYearText ||
    profile?.gender ||
    profile?.chronicConditions ||
    profile?.allergies ||
    profile?.currentMedications
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with risk color */}
        <div className={`rounded-xl px-4 py-3 mb-4 ${levelConfig.bg}`}>
          <p className="text-lg font-bold">
            {levelConfig.emoji} {levelConfig.label}
          </p>
          <p className="text-sm mt-1">{result.reason}</p>
        </div>

        {/* 主诉 */}
        <Section title="主诉">{chiefComplaint}</Section>

        {/* 症状经过 */}
        <Section title="症状经过">{symptomTimeline || '无'}</Section>

        {/* 患者信息 */}
        {hasProfileInfo && (
          <Section title="患者信息">
            {birthYearText && <InfoLine label="出生年份" value={birthYearText} />}
            {profile?.gender && <InfoLine label="性别" value={profile.gender} />}
            {profile?.chronicConditions && (
              <InfoLine label="基础疾病" value={profile.chronicConditions} />
            )}
            {profile?.allergies && <InfoLine label="过敏史" value={profile.allergies} />}
            {profile?.currentMedications && (
              <InfoLine label="现用药" value={profile.currentMedications} />
            )}
          </Section>
        )}

        {/* 建议科室 */}
        <Section title="建议科室">
          <div className="flex flex-wrap gap-1.5">
            {result.departments.map((dept) => (
              <span
                key={dept}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
              >
                {dept}
              </span>
            ))}
          </div>
        </Section>

        {/* AI建议 */}
        <Section title="AI建议">
          <p className="text-sm text-slate-600">{result.action}</p>
        </Section>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">{result.disclaimer}</p>
          <p className="text-xs text-slate-400 text-center mt-1">
            长按截图保存，就诊时出示给医生
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
        >
          关闭
        </button>
      </motion.div>
    </motion.div>
  );
}
