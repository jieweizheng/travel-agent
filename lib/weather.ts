const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  current_units?: Record<string, string>;
}

const WEATHER_CODES: Record<number, string> = {
  0: '晴朗',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴天',
  45: '有雾',
  48: '雾凇',
  51: '毛毛雨',
  53: '毛毛雨',
  55: '强毛毛雨',
  56: '冻毛毛雨',
  57: '强冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  85: '阵雪',
  86: '强阵雪',
  95: '雷雨',
  96: '雷雨伴有小冰雹',
  99: '雷雨伴有大冰雹',
};

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`天气服务暂时不可用（HTTP ${response.status}）`);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentWeather(cityInput: string) {
  const city = cityInput.trim();
  if (!city) throw new Error('请提供要查询的城市名。');

  const geocodingUrl = new URL(GEOCODING_URL);
  geocodingUrl.search = new URLSearchParams({
    name: city,
    count: '5',
    language: 'zh',
    format: 'json',
  }).toString();

  const geocoding = await fetchJson<GeocodingResponse>(geocodingUrl);
  const places = geocoding.results ?? [];
  const place =
    places.find((item) => item.name.toLowerCase() === city.toLowerCase()) ?? places[0];

  if (!place) {
    throw new Error(`没有找到“${city}”，请尝试提供更具体的城市名。`);
  }

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m',
    timezone: place.timezone || 'auto',
  }).toString();

  const forecast = await fetchJson<ForecastResponse>(forecastUrl);
  if (!forecast.current) throw new Error('天气服务没有返回当前天气数据。');

  const current = forecast.current;
  return {
    city: place.name,
    region: [place.admin1, place.country].filter(Boolean).join('，'),
    observedAt: current.time,
    weather: WEATHER_CODES[current.weather_code] ?? '未知天气',
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    windSpeed: current.wind_speed_10m,
    units: forecast.current_units,
    source: 'Open-Meteo',
  };
}
