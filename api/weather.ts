import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { location } = req.query;
  const key = process.env.VITE_QWEATHER_KEY;
  const host = (process.env.VITE_QWEATHER_HOST || 'devapi.qweather.com').trim();

  if (!key || !location) {
    return res.status(400).json({ error: 'Missing params' });
  }

  try {
    const resp = await fetch(
      `https://${host}/v7/weather/now?location=${encodeURIComponent(String(location))}&key=${key}`
    );
    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
