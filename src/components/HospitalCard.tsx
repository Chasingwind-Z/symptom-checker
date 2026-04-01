import { useState } from 'react';
import { MapPin, Phone, Star, Clock, Navigation } from 'lucide-react';
import type { Hospital } from '../types';
import { MapModal } from './MapModal';

interface HospitalCardProps {
  hospital: Hospital;
}

const TYPE_STYLES: Record<Hospital['type'], string> = {
  '三甲医院': 'bg-red-50 text-red-600 border border-red-200',
  '二甲医院': 'bg-blue-50 text-blue-600 border border-blue-200',
  '社区诊所': 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  '专科医院': 'bg-purple-50 text-purple-600 border border-purple-200',
};

export function HospitalCard({ hospital }: HospitalCardProps) {
  const [showMap, setShowMap] = useState(false);
  const amapUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(hospital.name)}`;

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-white hover:shadow-sm transition-all">
      {/* Row 1: name + type + rating */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-800 font-semibold text-sm flex-1 truncate">{hospital.name}</span>
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
        <a href={`tel:${hospital.phone}`} className="text-blue-500 text-sm hover:text-blue-600 transition-colors">
          {hospital.phone}
        </a>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowMap(true)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <MapPin size={14} />
          查看地图
        </button>
        <a
          href={amapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-500 text-white rounded-xl px-4 py-2 text-sm flex items-center justify-center gap-1.5 hover:bg-blue-600 transition-colors"
        >
          <Navigation size={14} />
          立即前往
        </a>
      </div>

      {showMap && <MapModal hospital={hospital} onClose={() => setShowMap(false)} />}
    </div>
  );
}
