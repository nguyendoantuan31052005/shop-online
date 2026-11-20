const { HttpError } = require('./db');

const CACHE_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 24;

function classifyCondition(code, isDay) {
  const value = Number(code);
  if (value === 1000) return isDay ? 'sunny' : 'clear-night';
  if ([1003, 1006, 1009, 1030, 1135, 1147].includes(value)) return 'cloudy';
  if ([1066, 1069, 1072, 1114, 1117, 1168, 1171, 1198, 1201, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264].includes(value)) return 'snow';
  if ([1087, 1273, 1276, 1279, 1282].includes(value)) return 'storm';
  if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1204, 1207, 1240, 1243, 1246, 1249, 1252].includes(value)) return 'rain';
  return 'cloudy';
}

function createWeatherService({ apiKey = process.env.WEATHER_API_KEY, fetchImpl = globalThis.fetch } = {}) {
  const secret = String(apiKey || '').trim();
  const cache = new Map();
  const requestWindows = new Map();

  function cleanExpired(now) {
    for (const [key, entry] of cache) if (entry.expiresAt <= now) cache.delete(key);
    for (const [key, entry] of requestWindows) if (entry.expiresAt <= now) requestWindows.delete(key);
  }

  async function getCurrent(latitude, longitude, clientKey = 'unknown') {
    if (!secret) throw new HttpError(503, 'Live weather is not configured.');
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new HttpError(400, 'Invalid weather coordinates.');
    }

    const roundedLat = Math.round(latitude * 20) / 20;
    const roundedLon = Math.round(longitude * 20) / 20;
    const cacheKey = `${roundedLat},${roundedLon}`;
    const now = Date.now();
    cleanExpired(now);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) return cached.value;

    const window = requestWindows.get(clientKey) || { count: 0, expiresAt: now + RATE_WINDOW_MS };
    if (window.count >= MAX_REQUESTS_PER_WINDOW) throw new HttpError(429, 'Too many weather requests. Please try again later.');
    window.count += 1;
    requestWindows.set(clientKey, window);

    const endpoint = new URL('https://api.weatherapi.com/v1/current.json');
    endpoint.searchParams.set('key', secret);
    endpoint.searchParams.set('q', `${roundedLat},${roundedLon}`);
    endpoint.searchParams.set('lang', 'vi');
    endpoint.searchParams.set('aqi', 'no');

    let response;
    try {
      response = await fetchImpl(endpoint, { signal: AbortSignal.timeout(10000) });
    } catch {
      throw new HttpError(502, 'Live weather service is temporarily unavailable.');
    }
    let payload;
    try { payload = await response.json(); }
    catch { throw new HttpError(502, 'Live weather service returned invalid data.'); }
    if (!response.ok || payload?.error) {
      const providerCode = Number(payload?.error?.code);
      if (providerCode === 1006) throw new HttpError(404, 'Weather is unavailable for this location.');
      if (providerCode === 2006 || providerCode === 2007 || providerCode === 2008 || response.status === 401 || response.status === 403) {
        console.error('WeatherAPI credential or quota error:', providerCode || response.status);
        throw new HttpError(503, 'Live weather is temporarily unavailable.');
      }
      throw new HttpError(502, 'Live weather service is temporarily unavailable.');
    }

    const location = payload.location || {};
    const current = payload.current || {};
    const condition = current.condition || {};
    if (!Number.isFinite(Number(current.temp_c)) || !Number.isFinite(Number(condition.code))) {
      throw new HttpError(502, 'Live weather service returned incomplete data.');
    }

    const value = {
      location: [location.name, location.region].filter(Boolean).join(', '),
      country: location.country || '',
      temperatureC: Number(current.temp_c),
      feelsLikeC: Number.isFinite(Number(current.feelslike_c)) ? Number(current.feelslike_c) : null,
      condition: String(condition.text || ''),
      conditionCode: Number(condition.code),
      kind: classifyCondition(condition.code, Number(current.is_day) === 1),
      icon: String(condition.icon || ''),
      isDay: Number(current.is_day) === 1,
      updatedAt: String(current.last_updated || ''),
      provider: 'WeatherAPI.com'
    };
    cache.set(cacheKey, { value, expiresAt: now + CACHE_MS });
    return value;
  }

  return { isConfigured: () => secret.length > 0, getCurrent };
}

module.exports = { createWeatherService, classifyCondition };
