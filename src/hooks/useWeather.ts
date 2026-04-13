import { useState, useEffect } from 'react';

interface WeatherState {
  status: 'idle' | 'loading' | 'success' | 'failed';
  temp?: string;
  text?: string;
  humidity?: string;
  error?: string;
}

function debugLog(...args: unknown[]) {
  if (localStorage.getItem('debug.location') === 'true') {
    console.info('[weather]', ...args);
  }
}

export function useWeather(lat?: number, lon?: number, city?: string) {
  const [state, setState] = useState<WeatherState>({ status: 'idle' });

  useEffect(() => {
    if (!lat && !lon && !city) return;

    const qweatherKey = import.meta.env.VITE_QWEATHER_KEY;
    const qweatherHost = (import.meta.env.VITE_QWEATHER_HOST as string | undefined) || 'devapi.qweather.com';

    if (!qweatherKey) {
      debugLog('No QWEATHER_KEY configured');
      setState({ status: 'failed', error: '未配置天气API' });
      return;
    }

    setState({ status: 'loading' });

    const locationParam =
      lat && lon
        ? `${lon.toFixed(2)},${lat.toFixed(2)}`
        : city || '';

    debugLog('Fetching weather for', { lat, lon, city, locationParam });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    // In dev mode use Vite proxy to avoid CORS issues
    const baseUrl = import.meta.env.DEV ? '/api/qweather' : `https://${qweatherHost}`;
    const url = `${baseUrl}/v7/weather/now?location=${encodeURIComponent(locationParam)}&key=${qweatherKey}`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timeout);
        debugLog('Weather response', data);
        if (data.code === '200' && data.now) {
          setState({
            status: 'success',
            temp: data.now.temp,
            text: data.now.text,
            humidity: data.now.humidity,
          });
        } else {
          debugLog('Weather API error code', data.code);
          setState({ status: 'failed', error: `API code: ${data.code}` });
        }
      })
      .catch((e) => {
        clearTimeout(timeout);
        debugLog('Weather fetch failed', e);
        setState({ status: 'failed', error: String(e) });
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [lat, lon, city]);

  return state;
}
