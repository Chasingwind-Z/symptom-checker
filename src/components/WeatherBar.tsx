import { MapPin } from 'lucide-react';
import type { WeatherData } from '../lib/geolocation';
import {
  buildWeatherExperienceSummary,
  buildWeatherTags,
  getWeatherEmoji,
} from '../lib/weatherExperience';

interface InfoBarProps {
  weather: WeatherData | null;
  profileCity?: string | null;
  chronicConditions?: string | null;
  onOpenMap?: () => void;
}

function buildProfileAwareWeatherTags(weather: WeatherData | null, chronicConditions?: string | null) {
  const tags: string[] = []
  const normalizedConditions = chronicConditions?.replace(/\s+/g, '') ?? ''
  const numericTemp = Number.parseFloat(weather?.temp ?? '')
  const humidity = Number.parseFloat(weather?.humidity ?? '')
  const weatherText = weather?.text ?? ''

  if (
    normalizedConditions.includes('哮喘') ||
    normalizedConditions.includes('COPD') ||
    normalizedConditions.includes('肺') ||
    normalizedConditions.includes('鼻炎')
  ) {
    tags.push('呼吸道注意')
  }
  if (
    (normalizedConditions.includes('高血压') || normalizedConditions.includes('心脏')) &&
    Number.isFinite(numericTemp) &&
    Math.abs(numericTemp - 20) > 10
  ) {
    tags.push('气温骤变注意')
  }
  if (
    normalizedConditions.includes('糖尿病') &&
    ((Number.isFinite(numericTemp) && numericTemp > 28) || (Number.isFinite(humidity) && humidity > 75))
  ) {
    tags.push('补水优先')
  }
  if (
    normalizedConditions.includes('鼻炎') &&
    (weatherText.includes('晴') || weatherText.includes('风'))
  ) {
    tags.push('花粉注意')
  }

  buildWeatherTags(weather).forEach((tag) => {
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
  })

  return tags.slice(0, 3)
}

function shortenTip(tip?: string) {
  if (!tip) return '点击查看附近资源'
  return tip
    .replace('天气寒冷，', '')
    .replace('天气炎热，', '')
    .replace('今天', '')
    .replace('注意', '')
    .replace('建议', '')
    .replace('，', '')
    .trim()
}

export function InfoBar({ weather, profileCity, chronicConditions, onOpenMap }: InfoBarProps) {
  const weatherSummary = buildWeatherExperienceSummary(weather)
  const displayCity = profileCity?.trim() && profileCity !== '中国大陆' ? profileCity.trim() : ''
  const weatherTags = buildProfileAwareWeatherTags(weather, chronicConditions)
  const humidity = weather?.humidity?.trim()
  const shortTip = weather ? shortenTip(weather.suggestion) : '位置获取中，点击查看附近资源'
  const Container = onOpenMap ? 'button' : 'div'

  return (
    <Container
      {...(onOpenMap
        ? {
            type: 'button',
            onClick: onOpenMap,
            title: '查看健康地图与附近资源',
          }
        : {})}
      className="w-full bg-gradient-to-r from-slate-50 via-blue-50 to-sky-50 border-b border-slate-200 px-4 py-1.5 text-left transition-colors hover:bg-sky-50/80"
    >
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <span className="flex flex-shrink-0 items-center gap-1 font-medium text-slate-700">
          <span role="img" aria-label="weather">
            {weather ? getWeatherEmoji(weather.text) : '📍'}
          </span>
          <span>{weather ? `${weather.temp} ${weather.text}` : weatherSummary.headline}</span>
          {displayCity && <span className="ml-0.5 font-normal text-slate-400">· {displayCity}</span>}
        </span>

        <span className="flex-shrink-0 text-slate-200">·</span>

        <span className="flex-shrink-0 text-slate-500">{shortTip}</span>

        {humidity && (
          <>
            <span className="flex-shrink-0 text-slate-200">·</span>
            <span className="flex-shrink-0 text-slate-500">湿 {humidity}</span>
          </>
        )}

        {weatherTags.length > 0 && (
          <>
            <span className="flex-shrink-0 text-slate-200">·</span>
            <span className="flex items-center gap-1.5">
              {weatherTags.map((tag) => (
                <span
                  key={tag}
                  className="flex-shrink-0 rounded-full bg-white/85 px-2 py-0.5 text-[11px] text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </span>
          </>
        )}

        <span className="ml-auto flex flex-shrink-0 items-center gap-1 text-slate-400">
          <MapPin size={11} />
          <span className="hidden sm:inline">{displayCity || '基于位置'}</span>
        </span>
      </div>
    </Container>
  );
}
