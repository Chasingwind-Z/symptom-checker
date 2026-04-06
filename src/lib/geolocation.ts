export interface LocationData {
  lat: number
  lon: number
  city?: string
}

export interface WeatherData {
  temp: string
  text: string
  suggestion: string
  feelsLike?: string
  humidity?: string
}

/** 获取浏览器定位 */
export function requestGeolocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 300000 }
    )
  })
}

/** 直接获取天气（不通过 AI 工具调用） */
export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const key = import.meta.env.VITE_QWEATHER_KEY as string | undefined
  const host = (import.meta.env.VITE_QWEATHER_HOST as string | undefined) || 'devapi.qweather.com'
  if (!key) {
    return null
  }

  const lonStr = lon.toFixed(2)
  const latStr = lat.toFixed(2)
  const params = `location=${lonStr},${latStr}&key=${key}`

  // In dev mode, use Vite proxy to avoid browser CORS/proxy issues
  const baseUrl = import.meta.env.DEV
    ? `/api/qweather`
    : `https://${host}`
  const url = `${baseUrl}/v7/weather/now?${params}`

  try {
    const res = await fetch(url)

    if (!res.ok) {
      return null
    }

    const data = await res.json()

    if (data.code !== '200' || !data.now) {
      return null
    }

    const now = data.now
    return {
      temp: now.temp + '°C',
      feelsLike: now.feelsLike + '°C',
      text: now.text,
      humidity: now.humidity + '%',
      suggestion: getWeatherSuggestion(now),
    }
  } catch {
    return null
  }
}

function getWeatherSuggestion(now: Record<string, string>): string {
  const temp = parseInt(now.temp)
  const text = now.text || ''
  if (temp < 5) return '天气寒冷，注意保暖预防感冒'
  if (temp > 35) return '天气炎热，注意防暑补水'
  if (text.includes('雨')) return '今天下雨，就医建议打车'
  if (text.includes('雪')) return '今天下雪，路面湿滑注意安全'
  if (parseInt(now.humidity) > 80) return '湿度较高，注意防潮'
  return '天气适宜，注意适时增减衣物'
}
