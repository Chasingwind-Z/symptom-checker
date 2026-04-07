import type { WeatherData } from './geolocation'

export interface WeatherExperienceSummary {
  headline: string
  description: string
  tags: string[]
}

const FALLBACK_TAGS = ['发热补水', '咳嗽观察', '头痛评估', '出门就医准备'] as const

export function getWeatherEmoji(text: string): string {
  if (text.includes('晴')) return '☀️'
  if (text.includes('多云')) return '⛅'
  if (text.includes('阴')) return '☁️'
  if (text.includes('雨')) return '🌧️'
  if (text.includes('雪')) return '❄️'
  if (text.includes('雾')) return '🌫️'
  return '🌡️'
}

export function buildWeatherTags(weather: WeatherData | null): string[] {
  if (!weather) return [...FALLBACK_TAGS]

  const tags: string[] = []
  const weatherText = weather.text
  const numericTemp = Number.parseFloat(weather.temp)
  const humidity = Number.parseFloat(weather.humidity ?? '')

  if (weatherText.includes('雨') || weatherText.includes('雪')) tags.push('雨雪出门提醒')
  if (weatherText.includes('雾')) tags.push('呼吸道防护')
  if (weatherText.includes('晴') && numericTemp >= 28) tags.push('高温补水')
  if (numericTemp <= 10) tags.push('降温后咳嗽/头痛')
  if (Number.isFinite(humidity) && humidity >= 80) tags.push('潮湿环境少受凉')

  FALLBACK_TAGS.forEach((tag) => {
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
  })

  return tags.slice(0, 4)
}

export function buildWeatherExperienceSummary(
  weather: WeatherData | null
): WeatherExperienceSummary {
  if (!weather) {
    return {
      headline: '今天先补充持续时间、体温和是否影响活动',
      description: '还没拿到本地天气时，会先按通用出门就医准备提醒你补齐关键信息。',
      tags: buildWeatherTags(null),
    }
  }

  const headline = `${weather.temp} · ${weather.text}`
  const detailParts = [
    weather.suggestion,
    weather.feelsLike ? `体感 ${weather.feelsLike}` : '',
    weather.humidity ? `湿度 ${weather.humidity}` : '',
  ].filter(Boolean)

  return {
    headline,
    description: `${detailParts.join('，')}。如需出门就医，记得带上现用药、过敏史和既往病历。`,
    tags: buildWeatherTags(weather),
  }
}
