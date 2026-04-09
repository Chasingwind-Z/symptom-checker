import { Shield } from 'lucide-react';

interface OfficialBadgeProps {
  partnerName?: string;
}

export function OfficialBadge({ partnerName }: OfficialBadgeProps) {
  if (!partnerName) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 bg-emerald-50 border-b border-emerald-100 px-3 py-1">
      <Shield size={11} className="text-emerald-600" />
      <p className="text-xs text-emerald-700">
        数据接受 <span className="font-medium">{partnerName}</span> 监督
      </p>
    </div>
  );
}
