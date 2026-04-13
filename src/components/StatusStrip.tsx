import { useState } from 'react';
import { ChevronUp, CloudSun, Check, Bell, MapPin } from 'lucide-react';

interface StatusStripProps {
  weatherText?: string;
  checkedIn?: boolean;
  pendingFollowUps?: number;
  locationText?: string;
  onOpenMap?: () => void;
  onRetryLocation?: () => void;
}

export function StatusStrip({ weatherText, checkedIn, pendingFollowUps, locationText, onOpenMap: _onOpenMap, onRetryLocation }: StatusStripProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('statusStrip.collapsed') === 'true';
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('statusStrip.collapsed', String(next));
  };

  if (collapsed) {
    return (
      <button
        onClick={toggleCollapse}
        className="w-full h-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        aria-label="展开状态栏"
      />
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
      {weatherText && (
        <span className="flex items-center gap-1 shrink-0">
          <CloudSun size={12} />
          {weatherText}
        </span>
      )}
      {checkedIn !== undefined && (
        <span className="flex items-center gap-1 shrink-0">
          <Check size={12} className={checkedIn ? 'text-emerald-500' : 'text-slate-300'} />
          {checkedIn ? '已打卡' : '未打卡'}
        </span>
      )}
      {pendingFollowUps !== undefined && pendingFollowUps > 0 && (
        <span className="flex items-center gap-1 shrink-0 text-amber-600">
          <Bell size={12} />
          {pendingFollowUps}项待跟进
        </span>
      )}
      {locationText && (
        <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          <MapPin size={12} />
          {locationText}
        </span>
      )}
      {!locationText && onRetryLocation && (
        <button
          onClick={onRetryLocation}
          className="flex items-center gap-1 shrink-0 text-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          <MapPin size={12} />
          启用定位
        </button>
      )}
      <button
        onClick={toggleCollapse}
        className="ml-auto text-slate-400 hover:text-slate-600 shrink-0"
      >
        <ChevronUp size={12} />
      </button>
    </div>
  );
}
