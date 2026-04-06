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

function buildWeatherTags(weather: WeatherData | null): string[] {
  if (!weather) return ['发热补水', '咳嗽观察', '头痛评估']

  const tags: string[] = []
  const weatherText = weather.text
  const numericTemp = Number.parseFloat(weather.temp)

  if (weatherText.includes('雨') || weatherText.includes('雪')) tags.push('雨雪出门提醒')
  if (weatherText.includes('雾')) tags.push('呼吸道防护')
  if (weatherText.includes('晴') && numericTemp >= 28) tags.push('高温补水')
  if (numericTemp <= 10) tags.push('降温后咳嗽/头痛')
  if (!tags.includes('发热补水')) tags.push('发热补水')
  if (!tags.includes('咳嗽观察')) tags.push('咳嗽观察')
  return tags.slice(0, 3)
}

export function InfoBar({ weather }: InfoBarProps) {
  const weatherTags = buildWeatherTags(weather)

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
            今日出门提醒：
            <span className="text-slate-700 font-medium"> {weather?.suggestion || '先描述最主要的不适，再决定是否需要线下处理'}</span>
          </span>
          <span className="text-slate-200">·</span>
          <span className="text-slate-500">
            适合关注：{weatherTags.map((s, i) => (
              <span key={s}>
                <span className="text-slate-700 font-medium">{s}</span>
                {i < weatherTags.length - 1 && '、'}
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
