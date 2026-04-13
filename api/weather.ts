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
  const host = (process.env.VITE_QWEATHER_HOST || 'devapi.qweather.com').trim();

  if (!key) {
    return res.status(500).json({ error: 'Weather API key not configured' });
  }
  if (!location) {
    return res.status(400).json({ error: 'Missing location param' });
  }

  try {
    const resp = await fetch(
      `https://${host}/v7/weather/now?location=${encodeURIComponent(String(location))}&key=${key}`
    );
    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(resp.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
