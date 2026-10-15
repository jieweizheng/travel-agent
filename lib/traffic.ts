const GEOCODING_URL = 'https://api.map.baidu.com/geocoding/v3/';
const DRIVING_URL = 'https://api.map.baidu.com/directionlite/v1/driving';

interface BaiduGeocodingResponse {
  status: number;
  message?: string;
  result?: { location?: { lat: number; lng: number }; level?: string };
}

interface BaiduRoute {
  distance: number;
  duration: number;
  toll?: number;
  traffic_condition?: number;
  restriction_info?: { status?: number; desc?: string };
}

interface BaiduDrivingResponse {
  status: number;
  message?: string;
  result?: { routes?: BaiduRoute[] };
}

const TRAFFIC_LABELS: Record<number, string> = {
  0: '暂无路况信息',
  1: '畅通',
  2: '缓行',
  3: '拥堵',
  4: '严重拥堵',
};

async function fetchBaidu<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`百度地图服务暂时不可用（HTTP ${response.status}）`);
  }

  return response.json() as Promise<T>;
}

async function geocode(address: string, ak: string) {
  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({ address, output: 'json', ak }).toString();
  const response = await fetchBaidu<BaiduGeocodingResponse>(url);
  const location = response.result?.location;

  if (response.status !== 0 || !location) {
    throw new Error(`百度地图无法解析地点“${address}”：${response.message || '请补充城市或区县信息。'}`);
  }

  return location;
}

export async function getDrivingTraffic(fromInput: string, toInput: string) {
  const from = fromInput.trim();
  const to = toInput.trim();
  if (!from || !to) throw new Error('请提供完整的出发地和目的地。');

  const ak = process.env.BAIDU_MAP_AK?.trim();
  if (!ak) throw new Error('服务端未配置 BAIDU_MAP_AK，请在 .env.local 中设置百度地图密钥。');

  const [origin, destination] = await Promise.all([
    geocode(from, ak),
    geocode(to, ak),
  ]);

  const url = new URL(DRIVING_URL);
  url.search = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    ak,
    coord_type: 'bd09ll',
  }).toString();

  const response = await fetchBaidu<BaiduDrivingResponse>(url);
  if (response.status !== 0) {
    throw new Error(`百度地图路线规划失败：${response.message || `服务状态码 ${response.status}`}`);
  }

  const routes = response.result?.routes ?? [];
  const bestRoute = routes[0];
  if (!bestRoute) throw new Error('百度地图没有找到这两个地点之间的驾车路线。');

  return {
    from,
    to,
    source: '百度地图',
    queriedAt: new Date().toISOString(),
    routeCount: routes.length,
    distanceMeters: bestRoute.distance,
    durationSeconds: bestRoute.duration,
    estimatedMinutes: Math.ceil(bestRoute.duration / 60),
    tollYuan: bestRoute.toll,
    trafficConditionCode: bestRoute.traffic_condition,
    congestion:
      bestRoute.traffic_condition === undefined
        ? '百度地图未提供路况评价'
        : TRAFFIC_LABELS[bestRoute.traffic_condition] ?? '未知路况',
    restrictionInfo: bestRoute.restriction_info,
  };
}
