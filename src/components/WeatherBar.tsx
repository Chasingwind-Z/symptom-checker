import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, MapPin } from 'lucide-react';
import type { WeatherData } from '../lib/geolocation';

interface WeatherBarProps {
  weather: WeatherData | null;
}

function getWeatherIcon(text: string) {
  if (text.includes('晴')) return <Sun size={16} className="text-amber-500" />;
  if (text.includes('多云')) return <Cloud size={16} className="text-slate-400" />;
  if (text.includes('阴')) return <Cloud size={16} className="text-slate-500" />;
  if (text.includes('雨')) return <CloudRain size={16} className="text-blue-500" />;
  if (text.includes('雪')) return <CloudSnow size={16} className="text-blue-300" />;
  return <Thermometer size={16} className="text-orange-400" />;
}

export function WeatherBar({ weather }: WeatherBarProps) {
  if (!weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100 px-4 py-2 flex items-center gap-3 text-sm">
      {getWeatherIcon(weather.text)}

      <span className="text-slate-600 font-medium text-sm">
        {weather.temp} · {weather.text}
      </span>

      <span className="text-slate-200 mx-1">|</span>

      <span className="text-blue-600 text-xs">{weather.suggestion}</span>

      <span className="ml-auto flex items-center gap-1">
        <MapPin size={12} className="text-slate-300" />
        <span className="text-slate-300 text-xs">基于您的位置</span>
      </span>
    </div>
  );
}
