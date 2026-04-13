import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const { location } = req.query;
  const key = process.env.VITE_QWEATHER_KEY;

  if (!key) {
    return res.status(500).json({ error: 'Weather API key not configured' });
  }
  if (!location) {
    return res.status(400).json({ error: 'Missing location param' });
  }

  // Try both hosts — free tier uses devapi, paid tier uses api
  const hosts = ['devapi.qweather.com', 'api.qweather.com'];

  for (const host of hosts) {
    try {
      const url = `https://${host}/v7/weather/now?location=${encodeURIComponent(String(location))}&key=${key}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        if (data.code === '200') {
          res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.status(200).json(data);
        }
      }
      // If 403 or non-200 code, try next host
    } catch {
      continue;
    }
  }

  // Both hosts failed
  return res.status(502).json({
    error: 'Weather API unavailable',
    debug: 'Both devapi and api hosts returned errors. Check QWeather console for key status.',
  });
}
