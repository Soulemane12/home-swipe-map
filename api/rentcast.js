// Vercel Serverless Function for RentCast API Proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || '8cff165c84f8488eb57aeab43164eb00';
  const BASE = 'https://api.rentcast.io/v1';

  try {
    const mode = (req.query.mode || 'rent').toString();
    const endpoint = mode === 'buy' ? '/listings/sale' : '/listings/rental/long-term';

    const u = new URL(BASE + endpoint);

    // Map frontend params to RentCast API params
    const paramMap = {
      city: 'city',
      state: 'state',
      latitude: 'latitude',
      longitude: 'longitude',
      limit: 'limit',
      offset: 'offset',
    };

    const hasCoords = req.query.latitude && req.query.longitude;

    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'mode' || v == null) continue;

      // Handle range params like "2200-5200" -> priceMin=2200&priceMax=5200
      if (k === 'price' && typeof v === 'string' && v.includes('-')) {
        const [min, max] = v.split('-');
        if (min) u.searchParams.set('priceMin', min);
        if (max) u.searchParams.set('priceMax', max);
      } else if (k === 'bedrooms' && typeof v === 'string' && v.includes('-')) {
        const [min, max] = v.split('-');
        if (min) u.searchParams.set('bedroomsMin', min);
        if (max) u.searchParams.set('bedroomsMax', max);
      } else if (k === 'bathrooms' && typeof v === 'string' && v.includes('-')) {
        const [min, max] = v.split('-');
        if (min) u.searchParams.set('bathroomsMin', min);
        if (max) u.searchParams.set('bathroomsMax', max);
      } else if (k === 'radius' && hasCoords) {
        u.searchParams.set('radius', String(v));
      } else if (paramMap[k]) {
        u.searchParams.set(paramMap[k], Array.isArray(v) ? v.join(',') : String(v));
      }
    }

    const response = await fetch(u.toString(), {
      headers: {
        'X-Api-Key': RENTCAST_API_KEY,
        'accept': 'application/json'
      },
    });

    const text = await response.text();
    res.status(response.status).setHeader('Content-Type', 'application/json').send(text);
  } catch (error) {
    console.error('RentCast proxy error:', error);
    res.status(500).json({ error: String(error) });
  }
}
