import { MapPin } from 'lucide-react';
import type { WeatherData } from '../lib/geolocation';

interface InfoBarProps {
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

const TOP_SYMPTOMS = ['发烧', '咳嗽', '头痛'];

export function InfoBar({ weather }: InfoBarProps) {
  return (
    <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-sky-50 border-b border-slate-200 px-4 py-1.5">
      <div className="flex items-center gap-3 text-xs">
        {/* 天气部分 */}
        {weather && (
          <>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span role="img" aria-label="weather">{getWeatherEmoji(weather.text)}</span>
              <span className="text-slate-700 font-medium">
                {weather.temp} {weather.text}
              </span>
              <span className="text-blue-500">{weather.suggestion}</span>
            </span>
            <span className="text-slate-200">|</span>
          </>
        )}

        {/* 统计部分 */}
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-slate-500">
            今日关注：
            <span className="text-slate-700 font-medium"> 呼吸道不适、发热、头痛</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="text-slate-500">
            热门：{TOP_SYMPTOMS.map((s, i) => (
              <span key={s}>
                <span className="text-slate-700 font-medium">{s}</span>
                {i < TOP_SYMPTOMS.length - 1 && '、'}
              </span>
            ))}
          </span>
        </span>

        {/* 定位标识 */}
        {weather && (
          <span className="ml-auto flex items-center gap-1 flex-shrink-0 text-slate-400">
            <MapPin size={11} />
            <span className="hidden sm:inline">基于位置</span>
          </span>
        )}
      </div>
    </div>
  );
}
