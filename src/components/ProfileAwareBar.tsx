import { User, ChevronRight } from 'lucide-react';

interface ProfileAwareBarProps {
  profile?: {
    displayName?: string;
    birthYear?: number | null;
    gender?: string;
    allergies?: string;
    chronicConditions?: string;
    currentMedications?: string;
  } | null;
  onEditProfile?: () => void;
}

export function ProfileAwareBar({ profile, onEditProfile }: ProfileAwareBarProps) {
  const hasData = profile && (profile.birthYear || profile.gender || profile.allergies || profile.chronicConditions);

  const summaryParts: string[] = [];
  if (profile?.birthYear) {
    const approxAge = 2026 - profile.birthYear;
    summaryParts.push(`${approxAge}岁`);
  }
  if (profile?.gender) summaryParts.push(profile.gender);
  if (profile?.allergies) summaryParts.push(`过敏:${profile.allergies.slice(0, 8)}`);
  if (profile?.chronicConditions) summaryParts.push(profile.chronicConditions.slice(0, 8));

  return (
    <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-4 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <User size={11} className="text-blue-600" />
        </div>
        {hasData ? (
          <p className="text-xs text-slate-600 truncate">
            已知：{summaryParts.join(' · ')}
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            填写档案让建议更准确
          </p>
        )}
      </div>
      <button
        onClick={onEditProfile}
        className="flex items-center gap-0.5 text-xs text-blue-500 hover:text-blue-600 shrink-0"
      >
        {hasData ? '编辑' : '去填写'}
        <ChevronRight size={12} />
      </button>
    </div>
  );
}
