import { Sun, Cloud, CloudRain, CloudSnow, Thermometer, MapPin } from 'lucide-react';
import type { WeatherData } from '../lib/geolocation';

interface WeatherBarProps {
  weather: WeatherData | null;
}

function getWeatherEmoji(text: string): string {
  if (text.includes('晴')) return '☀️'
  if (text.includes('多云')) return '⛅'
  if (text.includes('阴')) return '☁️'
  if (text.includes('雨')) return '🌧️'
  if (text.includes('雪')) return '❄️'
  if (text.includes('雾')) return '🌫️'
  return '🌡️'
}

function getWeatherIcon(text: string) {
  if (text.includes('晴')) return <Sun size={18} className="text-amber-500" />;
  if (text.includes('多云')) return <Cloud size={18} className="text-slate-400" />;
  if (text.includes('阴')) return <Cloud size={18} className="text-slate-500" />;
  if (text.includes('雨')) return <CloudRain size={18} className="text-blue-500" />;
  if (text.includes('雪')) return <CloudSnow size={18} className="text-blue-300" />;
  if (text.includes('雾')) return <Cloud size={18} className="text-slate-400" />;
  return <Thermometer size={18} className="text-orange-400" />;
}

export function WeatherBar({ weather }: WeatherBarProps) {
  if (!weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-200 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {/* 天气图标 + emoji 双保险 */}
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-base" role="img" aria-label="weather">{getWeatherEmoji(weather.text)}</span>
          {getWeatherIcon(weather.text)}
        </span>

        {/* 温度和天气 */}
        <span className="text-slate-700 font-semibold text-sm flex-shrink-0">
          {weather.temp}
        </span>
        <span className="text-slate-500 text-sm flex-shrink-0">
          {weather.text}
        </span>

        {/* 分隔线 */}
        <span className="text-slate-300 mx-0.5 hidden sm:inline">|</span>

        {/* 建议 */}
        <span className="text-blue-600 text-xs truncate">
          {weather.suggestion}
        </span>

        {/* 定位标识 */}
        <span className="ml-auto flex items-center gap-1 flex-shrink-0">
          <MapPin size={12} className="text-slate-400" />
          <span className="text-slate-400 text-xs hidden sm:inline">基于您的位置</span>
        </span>
      </div>
    </div>
  );
}
