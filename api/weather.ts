import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { location } = req.query;
  const key = process.env.VITE_QWEATHER_KEY;
  // Custom API host from QWeather console (e.g. "abc123.qweatherapi.com")
  const customHost = process.env.QWEATHER_API_HOST;

  if (!key) {
    return res.status(500).json({ error: 'Weather API key not configured' });
  }
  if (!location) {
    return res.status(400).json({ error: 'Missing location param' });
  }

  const loc = encodeURIComponent(String(location));

  // Strategy 1: New API — custom host + X-QW-Api-Key header (2024+ accounts)
  if (customHost) {
    try {
      const url = `https://${customHost}/v7/weather/now?location=${loc}`;
      const resp = await fetch(url, {
        headers: {
          'X-QW-Api-Key': key,
          'Accept-Encoding': 'gzip',
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.code === '200') {
          res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).json(data);
        }
      }
    } catch {
      // Fall through to legacy hosts
    }
  }

  // Strategy 2: Legacy API — devapi/api host + key in URL (older accounts)
  const legacyHosts = ['devapi.qweather.com', 'api.qweather.com'];
  for (const host of legacyHosts) {
    try {
      const url = `https://${host}/v7/weather/now?location=${loc}&key=${key}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.code === '200') {
          res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).json(data);
        }
      }
    } catch {
      continue;
    }
  }

  // Strategy 3: New API — try custom host with key in header on standard hosts
  for (const host of ['devapi.qweather.com', 'api.qweather.com']) {
    try {
      const url = `https://${host}/v7/weather/now?location=${loc}`;
      const resp = await fetch(url, {
        headers: { 'X-QW-Api-Key': key },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.code === '200') {
          res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).json(data);
        }
      }
    } catch {
      continue;
    }
  }

  return res.status(502).json({
    error: 'Weather API unavailable',
    debug: 'All strategies failed. Set QWEATHER_API_HOST env var to your custom host from console.qweather.com/setting.',
  });
}
