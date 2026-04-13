import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  status: 'idle' | 'loading' | 'success' | 'failed';
  lat?: number;
  lon?: number;
  city?: string;
  source?: 'gps' | 'ip' | 'cache' | 'default';
  error?: string;
}

const CACHE_KEY = 'last_known_location';
const DEBUG_KEY = 'debug.location';

function debugLog(...args: unknown[]) {
  if (localStorage.getItem(DEBUG_KEY) === 'true') {
    console.info('[location]', ...args);
  }
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ status: 'idle' });

  const locate = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading' }));

    // Tier 1: Browser GPS (8s timeout)
    debugLog('GPS attempt started');
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          maximumAge: 600000,
          enableHighAccuracy: false,
        });
      });
      debugLog('GPS success', pos.coords.latitude, pos.coords.longitude);
      const result: LocationState = {
        status: 'success',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        source: 'gps',
      };
      // Try reverse geocode for city name
      try {
        const amapKey = import.meta.env.VITE_AMAP_WEB_KEY || import.meta.env.VITE_AMAP_KEY;
        if (amapKey) {
          const resp = await fetch(
            `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${pos.coords.longitude},${pos.coords.latitude}&extensions=base`,
          );
          const data = await resp.json();
          if (data.status === '1' && data.regeocode?.addressComponent?.city) {
            const city = Array.isArray(data.regeocode.addressComponent.city)
              ? data.regeocode.addressComponent.city[0]
              : data.regeocode.addressComponent.city;
            result.city = city || data.regeocode.addressComponent.province;
          }
        }
      } catch (e) {
        debugLog('Reverse geocode failed', e);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      setState(result);
      return result;
    } catch (e) {
      debugLog('GPS failed, trying IP fallback', e);
    }

    // Tier 2: AMap IP location
    try {
      const amapKey = import.meta.env.VITE_AMAP_WEB_KEY || import.meta.env.VITE_AMAP_KEY;
      if (amapKey) {
        debugLog('IP location attempt');
        const resp = await fetch(`https://restapi.amap.com/v3/ip?key=${amapKey}`);
        const data = await resp.json();
        debugLog('IP response', data);
        if (data.status === '1' && data.city) {
          const rect = data.rectangle?.split(';')[0]?.split(',') || [];
          const result: LocationState = {
            status: 'success',
            lat: parseFloat(rect[1]) || 31.3,
            lon: parseFloat(rect[0]) || 120.6,
            city: typeof data.city === 'string' ? data.city : '',
            source: 'ip',
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
          setState(result);
          return result;
        }
      }
    } catch (e) {
      debugLog('IP location failed', e);
    }

    // Tier 3: Cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as LocationState;
        debugLog('Using cached location', parsed);
        const result = { ...parsed, source: 'cache' as const, status: 'success' as const };
        setState(result);
        return result;
      }
    } catch { /* corrupted cache */ }

    // Tier 4: Default
    debugLog('All location methods failed, using default');
    const fallback: LocationState = { status: 'failed', error: '无法获取位置' };
    setState(fallback);
    return fallback;
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, retry: locate };
}
