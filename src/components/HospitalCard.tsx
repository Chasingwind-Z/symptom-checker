import { useState } from 'react';
import { Cross, MapPin, Phone, Star, Clock, Navigation } from 'lucide-react';
import type { Hospital } from '../types';
import { MapModal } from './MapModal';

interface HospitalCardProps {
  hospital: Hospital;
  allHospitals?: Hospital[];
}

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}

const TYPE_STYLES: Record<Hospital['type'], string> = {
  '三甲医院': 'bg-red-50 text-red-600 border border-red-200',
  '二甲医院': 'bg-blue-50 text-blue-600 border border-blue-200',
  '社区诊所': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  '专科医院': 'bg-purple-50 text-purple-600 border border-purple-200',
};

function QuickAction({ label, icon, href, onClick, primary = false, disabled = false }: QuickActionProps) {
  const baseClassName =
    'flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200';
  const variantClassName = primary
    ? disabled
      ? 'bg-blue-200 text-white cursor-not-allowed'
      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-100'
    : disabled
      ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300';

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={href.startsWith('tel:') ? undefined : '_blank'}
        rel={href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
        className={`${baseClassName} ${variantClassName}`}
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClassName} ${variantClassName}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function HospitalCard({ hospital, allHospitals }: HospitalCardProps) {
  const [showMap, setShowMap] = useState(false);
  const hasPhone = hospital.phone.trim().length > 0 && !hospital.phone.includes('暂无');
  const phoneHref = hasPhone ? `tel:${hospital.phone.replace(/\s+/g, '')}` : undefined;
  const navUrl = `https://uri.amap.com/navigation?to=${encodeURIComponent(
    `${hospital.longitude},${hospital.latitude},${hospital.name}`
  )}&mode=car&src=symptom-checker&coordinate=gaode&callnative=1`;
  const mapUrl = `https://uri.amap.com/marker?position=${hospital.longitude},${hospital.latitude}&name=${encodeURIComponent(
    hospital.name
  )}&src=symptom-checker&coordinate=gaode&callnative=1`;
  const pharmacyUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(
    '附近药房'
  )}&center=${hospital.longitude},${hospital.latitude}&src=symptom-checker&coordinate=gaode&callnative=1`;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4 hover:bg-white hover:shadow-sm transition-all">
      {/* Row 1: name + type + rating */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-800 font-semibold text-sm flex-1 break-words">{hospital.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_STYLES[hospital.type]}`}>
          {hospital.type}
        </span>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-600 text-xs font-medium">{hospital.rating}</span>
        </div>
      </div>

      {/* Row 2: distance + wait time + emergency */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Navigation size={10} />
          {hospital.distance}
        </span>
        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock size={10} />
          {hospital.waitTime}
        </span>
        {hospital.emergency && (
          <span className="bg-red-50 text-red-600 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">
            急诊
          </span>
        )}
        {!hospital.openNow && (
          <span className="bg-slate-100 text-slate-400 text-xs px-2 py-0.5 rounded-full">
            暂未开放
          </span>
        )}
      </div>

      {/* Row 3: address */}
      <div className="flex items-start gap-1.5 mb-2">
        <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <span className="text-slate-500 text-xs">{hospital.address}</span>
      </div>

      {/* Row 4: phone */}
      <div className="flex items-center gap-1.5 mb-3">
        <Phone size={12} className="text-slate-400 flex-shrink-0" />
        {hasPhone ? (
          <>
            <a href={phoneHref} className="text-blue-500 text-sm hover:text-blue-600 transition-colors">
              {hospital.phone}
            </a>
            <span className="text-[11px] text-slate-400">可先电话确认接诊</span>
          </>
        ) : (
          <span className="text-slate-400 text-sm">暂无电话</span>
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl bg-slate-100/80 p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-slate-500">就诊快捷操作</span>
          <span className="text-[11px] text-slate-400">导航 · 电话 · 地图</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction label="一键导航" icon={<Navigation size={14} />} href={navUrl} primary />
          <QuickAction label="拨打电话" icon={<Phone size={14} />} href={phoneHref} disabled={!hasPhone} />
          <QuickAction label="地图查看" icon={<MapPin size={14} />} onClick={() => setShowMap(true)} />
          <QuickAction label="附近药房" icon={<Cross size={14} />} href={pharmacyUrl} />
        </div>
        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
          >
            在地图中打开完整路线
          </a>
          {!hospital.openNow && <span className="text-[11px] text-amber-600">到院前建议先电话确认</span>}
        </div>
      </div>

      {showMap && <MapModal hospital={hospital} allHospitals={allHospitals} onClose={() => setShowMap(false)} />}
    </div>
  );
}
