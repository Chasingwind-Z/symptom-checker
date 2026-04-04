import { MapPin } from 'lucide-react';
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

export function WeatherBar({ weather }: WeatherBarProps) {
  if (!weather) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100 px-4 py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base flex-shrink-0" role="img" aria-label="weather">
          {getWeatherEmoji(weather.text)}
        </span>

        <span className="text-slate-700 font-medium flex-shrink-0">
          {weather.temp} {weather.text}
        </span>

        <span className="text-slate-300 mx-0.5">|</span>

        <span className="text-blue-600 text-xs truncate">
          {weather.suggestion}
        </span>

        <span className="ml-auto flex items-center gap-1 flex-shrink-0">
          <MapPin size={12} className="text-slate-400" />
          <span className="text-slate-400 text-xs hidden sm:inline">基于您的位置</span>
        </span>
      </div>
    </div>
  );
}
