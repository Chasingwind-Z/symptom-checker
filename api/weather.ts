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
  // Support multiple env var names for the custom API host
  const customHost =
    process.env.QWEATHER_API_HOST ||
    process.env.VITE_QWEATHER_HOST ||
    process.env.VITE_QWEATHER_API_HOST;

  if (!key) {
    return res.status(500).json({
      error: 'Weather API key not configured',
      hint: 'Set VITE_QWEATHER_KEY in Vercel Environment Variables',
    });
  }
  if (!location) {
    return res.status(400).json({ error: 'Missing location param' });
  }

  // Log env var availability for debugging (values not exposed)
  console.log(`[weather] env check: key=${key ? 'set' : 'missing'}, customHost=${customHost || 'missing'}, ` +
    `QWEATHER_API_HOST=${process.env.QWEATHER_API_HOST ? 'set' : '-'}, ` +
    `VITE_QWEATHER_HOST=${process.env.VITE_QWEATHER_HOST ? 'set' : '-'}`
  );

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
        console.log(`[weather] Strategy 1 (custom host) failed: code=${data.code}`);
      } else {
        console.log(`[weather] Strategy 1 (custom host) failed: status=${resp.status}`);
      }
    } catch (err) {
      console.log(`[weather] Strategy 1 (custom host) error:`, err);
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
        console.log(`[weather] Strategy 2 (${host} legacy) failed: code=${data.code}`);
      } else {
        console.log(`[weather] Strategy 2 (${host} legacy) failed: status=${resp.status}`);
      }
    } catch (err) {
      console.log(`[weather] Strategy 2 (${host} legacy) error:`, err);
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
        console.log(`[weather] Strategy 3 (${host} header) failed: code=${data.code}`);
      } else {
        console.log(`[weather] Strategy 3 (${host} header) failed: status=${resp.status}`);
      }
    } catch (err) {
      console.log(`[weather] Strategy 3 (${host} header) error:`, err);
      continue;
    }
  }

  return res.status(502).json({
    error: 'Weather API unavailable',
    debug: `All strategies failed. customHost=${customHost || 'not set'}`,
    hint: 'Check Vercel Environment Variables: VITE_QWEATHER_KEY and VITE_QWEATHER_HOST (or QWEATHER_API_HOST)',
  });
}
