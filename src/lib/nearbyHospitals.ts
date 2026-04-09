import type { Hospital, RiskLevel } from '../types';
import { getHospitalsByCity, filterHospitalsByRisk } from './mockHospitals';

const WEB_KEY = import.meta.env.VITE_AMAP_WEB_KEY as string;

interface AMapPOI {
  id: string;
  name: string;
  typecode: string;
  address: string | string[];
  location: string; // "lng,lat"
  tel: string | string[];
  distance: string;
}

function inferType(name: string, typecode: string): Hospital['type'] {
  if (typecode === '090101' || name.includes('三甲')) return '三甲医院';
  if (typecode.startsWith('0902')) return '专科医院';
  if (
    typecode.startsWith('0903') ||
    name.includes('诊所') ||
    name.includes('卫生站') ||
    name.includes('卫生服务中心') ||
    name.includes('卫生院')
  )
    return '社区诊所';
  if (name.includes('医院')) return '二甲医院';
  return '社区诊所';
}

const RATING_BY_TYPE: Record<Hospital['type'], number> = {
  '三甲医院': 4.8,
  '二甲医院': 4.4,
  '专科医院': 4.6,
  '社区诊所': 4.1,
};

const WAIT_BY_TYPE: Record<Hospital['type'], string> = {
  '三甲医院': '约60分钟',
  '二甲医院': '约30分钟',
  '专科医院': '约45分钟',
  '社区诊所': '约15分钟',
};

function formatDistance(meters: string): string {
  const m = parseInt(meters, 10);
  if (isNaN(m)) return '未知';
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}

function pickDepartments(level: RiskLevel, type: Hospital['type']): string[] {
  if (level === 'red') return ['急诊科', '内科', '外科'];
  if (level === 'orange') return ['内科', '外科'];
  if (type === '社区诊所') return ['全科'];
  return ['内科', '全科'];
}

export async function getUserLocation(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 60_000 }
    );
  });
}

const KEYWORD_BY_LEVEL: Record<RiskLevel, string> = {
  red: '急救中心,三甲医院,急诊',
  orange: '医院,综合医院',
  yellow: '社区卫生服务中心,诊所,医院',
  green: '社区卫生服务中心,诊所,药店',
};

export async function searchNearbyHospitals(
  longitude: number,
  latitude: number,
  level: RiskLevel,
  city?: string
): Promise<Hospital[]> {
  // When AMAP key is not configured, fall back to city-based mock data
  if (!WEB_KEY) {
    return filterHospitalsByRisk(getHospitalsByCity(city || '北京'), level);
  }

  const isUrgent = level === 'red' || level === 'orange';
  // 090100 综合医院 | 090101 三甲 | 090200 专科 | 090300 诊所 | 090400 药店
  const types = isUrgent
    ? '090100|090101|090200'
    : '090100|090200|090300|090400';
  const radius = isUrgent ? 5000 : 3000;

  const url = new URL('https://restapi.amap.com/v3/place/around');
  url.searchParams.set('key', WEB_KEY);
  url.searchParams.set('location', `${longitude},${latitude}`);
  url.searchParams.set('keywords', KEYWORD_BY_LEVEL[level]);
  url.searchParams.set('types', types);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('sortrule', 'distance');
  url.searchParams.set('offset', '8');
  url.searchParams.set('output', 'JSON');
  url.searchParams.set('extensions', 'base');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`POI请求失败: ${res.status}`);

  const data = await res.json();
  if (data.status !== '1' || !Array.isArray(data.pois) || data.pois.length === 0) {
    throw new Error('未找到附近医院');
  }

  return (data.pois as AMapPOI[]).map((poi): Hospital => {
    const [lng, lat] = poi.location.split(',').map(Number);
    const type = inferType(poi.name, poi.typecode);
    const phone = Array.isArray(poi.tel) ? poi.tel[0] : poi.tel;
    const address = Array.isArray(poi.address) ? poi.address[0] : poi.address;
    return {
      id: poi.id,
      name: poi.name,
      type,
      distance: formatDistance(poi.distance),
      address: address || '地址未知',
      phone: phone || '暂无电话',
      emergency: level === 'red' || type === '三甲医院',
      departments: pickDepartments(level, type),
      rating: RATING_BY_TYPE[type],
      waitTime: WAIT_BY_TYPE[type],
      openNow: true,
      longitude: lng,
      latitude: lat,
    };
  });
}