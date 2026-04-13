export interface LocationData {
  lat: number
  lon: number
  city?: string
  source?: 'gps' | 'ip' | 'cached' | 'default'
}

export interface WeatherData {
  temp: string
  text: string
  suggestion: string
  feelsLike?: string
  humidity?: string
}

const LOCATION_CACHE_KEY = 'last_known_location'

/** Tier 2: AMap IP-based fallback (city-level accuracy) */
async function fallbackToIPLocation(): Promise<{ city: string; lat: number; lon: number } | null> {
  try {
    const amapKey = (import.meta.env.VITE_AMAP_WEB_KEY as string | undefined)
      || (import.meta.env.VITE_AMAP_KEY as string | undefined)
    if (!amapKey) return null

    const response = await fetch(`https://restapi.amap.com/v3/ip?key=${amapKey}`)
    const data = await response.json()
    if (data.status === '1' && data.city) {
      const rect = data.rectangle?.split(';')[0]?.split(',') || []
      return {
        city: typeof data.city === 'string' ? data.city : '未知',
        lat: parseFloat(rect[1]) || 39.9,
        lon: parseFloat(rect[0]) || 116.4,
      }
    }
  } catch (e) {
    console.warn('[geo] IP fallback failed', e)
  }
  return null
}

/** Cache a successful location to localStorage */
function cacheLocation(loc: LocationData): void {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(loc))
  } catch { /* quota exceeded — ignore */ }
}

/**
 * 3-tier location: browser GPS → AMap IP → cache/default.
 * Resolves within ~8 s worst-case (GPS timeout).
 */
export async function getLocation(): Promise<LocationData> {
  // Tier 1: Browser geolocation (8 s timeout)
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持定位'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 600000,
        enableHighAccuracy: false,
      })
    })
    const loc: LocationData = { lat: pos.coords.latitude, lon: pos.coords.longitude, city: '', source: 'gps' }
    cacheLocation(loc)
    return loc
  } catch (e) {
    console.warn('[geo] Browser geolocation failed:', e)
  }

  // Tier 2: AMap IP location
  const ipResult = await fallbackToIPLocation()
  if (ipResult) {
    const loc: LocationData = { lat: ipResult.lat, lon: ipResult.lon, city: ipResult.city, source: 'ip' }
    cacheLocation(loc)
    return loc
  }

  // Tier 3: Cached location or default (Beijing)
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as LocationData
      if (parsed.lat && parsed.lon) {
        return { ...parsed, source: 'cached' }
      }
    }
  } catch { /* corrupted cache — ignore */ }

  return { lat: 39.9, lon: 116.4, city: '北京', source: 'default' }
}

/** @deprecated Use getLocation() instead */
export function requestGeolocation(): Promise<LocationData> {
  return getLocation()
}

/** 直接获取天气（不通过 AI 工具调用），5 s 超时 */
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

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

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
  } catch (e) {
    clearTimeout(timeout)
    console.warn('[weather] fetch failed or timed out', e)
    return null
  }
}

function getWeatherSuggestion(now: Record<string, string>): string {
  const temp = parseInt(now.temp)
  const text = now.text || ''
  if (temp < 5) return '注意保暖'
  if (temp > 35) return '防暑补水'
  if (text.includes('雨')) return '雨天建议打车'
  if (text.includes('雪')) return '路面湿滑'
  if (parseInt(now.humidity) > 80) return '湿度偏高'
  return '天气适宜'
}
