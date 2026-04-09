import type { Hospital, RiskLevel } from '../types';

type HospitalTier = 'community' | 'secondary' | 'tertiary' | 'emergency';

export function getHospitalTier(name: string): HospitalTier {
  if (/急诊中心|120|急救/.test(name)) return 'emergency';
  if (/社区|诊所|服务中心|卫生站|卫生院/.test(name)) return 'community';
  if (/三甲|大学|附属|协和|301|中日友好|人民医院|中心医院|儿童医院|心血管/.test(name)) return 'tertiary';
  return 'secondary';
}

export function filterHospitalsByRisk(hospitals: Hospital[], level: RiskLevel): Hospital[] {
  const tierMap: Record<RiskLevel, HospitalTier[]> = {
    green: ['community', 'secondary'],
    yellow: ['secondary', 'tertiary'],
    orange: ['tertiary', 'emergency'],
    red: ['emergency', 'tertiary'],
  };
  const allowedTiers = tierMap[level];
  const filtered = hospitals.filter((h) => allowedTiers.includes(getHospitalTier(h.name)));
  return filtered.length > 0 ? filtered : hospitals;
}

export const HOSPITALS_BY_CITY: Record<string, Hospital[]> = {
  '北京': [
    // 三甲医院
    { id: '1', name: '北京协和医院', type: '三甲医院', distance: '2.3km', address: '北京市东城区帅府园1号', phone: '010-69156699', emergency: true, departments: ['急诊科', '内科', '外科', '心内科', '神经科', '呼吸科'], rating: 4.9, waitTime: '约90分钟', openNow: true, latitude: 39.9056, longitude: 116.4194 },
    { id: '2', name: '北京大学人民医院', type: '三甲医院', distance: '3.8km', address: '北京市西城区西直门南大街11号', phone: '010-88326666', emergency: true, departments: ['急诊科', '心内科', '骨科', '消化科', '肿瘤科', '儿科'], rating: 4.8, waitTime: '约60分钟', openNow: true, latitude: 39.9219, longitude: 116.3634 },
    { id: '3', name: '首都医科大学附属北京天坛医院', type: '三甲医院', distance: '1.5km', address: '北京市丰台区南四环西路119号', phone: '010-59978000', emergency: true, departments: ['神经科', '急诊科', '脑外科', '神经内科', '放射科', '内科'], rating: 4.7, waitTime: '约45分钟', openNow: true, latitude: 39.8637, longitude: 116.3972 },
    // 二甲医院
    { id: '4', name: '北京市朝阳区第二医院', type: '二甲医院', distance: '0.8km', address: '北京市朝阳区朝阳路1号', phone: '010-85958234', emergency: true, departments: ['内科', '外科', '妇产科', '儿科', '急诊科'], rating: 4.3, waitTime: '约30分钟', openNow: true, latitude: 39.9219, longitude: 116.4732 },
    { id: '5', name: '北京市海淀区中西医结合医院', type: '二甲医院', distance: '2.1km', address: '北京市海淀区玉泉路3号', phone: '010-68661122', emergency: true, departments: ['中医科', '内科', '外科', '急诊科', '骨科'], rating: 4.4, waitTime: '约20分钟', openNow: true, latitude: 39.9032, longitude: 116.3752 },
    { id: '6', name: '北京市石景山医院', type: '二甲医院', distance: '3.0km', address: '北京市石景山区五环路47号', phone: '010-57836000', emergency: false, departments: ['内科', '外科', '妇产科', '康复科', '口腔科'], rating: 4.2, waitTime: '约40分钟', openNow: true, latitude: 39.9112, longitude: 116.3482 },
    // 社区诊所
    { id: '7', name: '朝阳社区卫生服务中心', type: '社区诊所', distance: '0.3km', address: '北京市朝阳区望京街10号', phone: '010-64718866', emergency: false, departments: ['全科', '内科', '中医科'], rating: 4.1, waitTime: '约10分钟', openNow: true, latitude: 39.9219, longitude: 116.4432 },
    { id: '8', name: '海淀区中关村社区卫生站', type: '社区诊所', distance: '0.6km', address: '北京市海淀区中关村大街88号', phone: '010-82680012', emergency: false, departments: ['全科', '儿科', '内科'], rating: 4.0, waitTime: '约15分钟', openNow: true, latitude: 39.9840, longitude: 116.3178 },
    { id: '9', name: '东城区和平里社区卫生服务中心', type: '社区诊所', distance: '1.2km', address: '北京市东城区和平里东街16号', phone: '010-64284488', emergency: false, departments: ['全科', '中医科', '康复科'], rating: 4.2, waitTime: '约12分钟', openNow: false, latitude: 39.9547, longitude: 116.4201 },
    { id: '10', name: '西城区月坛社区卫生服务中心', type: '社区诊所', distance: '1.5km', address: '北京市西城区月坛北街26号', phone: '010-68015566', emergency: false, departments: ['全科', '内科', '妇科'], rating: 4.1, waitTime: '约20分钟', openNow: true, latitude: 39.9157, longitude: 116.3687 },
    // 专科医院
    { id: '11', name: '北京心血管病医院', type: '专科医院', distance: '2.0km', address: '北京市西城区长安街甲10号', phone: '010-88398800', emergency: true, departments: ['心内科', '心外科', '急诊科', '血管科', '重症医学科'], rating: 4.8, waitTime: '约50分钟', openNow: true, latitude: 39.9023, longitude: 116.3798 },
    { id: '12', name: '北京儿童医院', type: '专科医院', distance: '4.8km', address: '北京市西城区南礼士路56号', phone: '010-59616161', emergency: true, departments: ['儿科', '急诊科', '小儿外科', '儿童保健科', '新生儿科'], rating: 4.9, waitTime: '约75分钟', openNow: true, latitude: 39.9078, longitude: 116.3562 },
  ],
  '上海': [
    { id: 'sh-1', name: '上海瑞金医院', type: '三甲医院', distance: '3.2km', address: '上海市黄浦区瑞金二路197号', phone: '021-64370045', emergency: true, departments: ['内科', '外科', '心血管', '消化', '呼吸'], rating: 4.8, waitTime: '约45分钟', openNow: true, latitude: 31.2108, longitude: 121.4728 },
    { id: 'sh-2', name: '上海华山医院', type: '三甲医院', distance: '4.1km', address: '上海市静安区乌鲁木齐中路12号', phone: '021-52889999', emergency: true, departments: ['神经内科', '皮肤科', '感染科', '外科'], rating: 4.7, waitTime: '约50分钟', openNow: true, latitude: 31.2201, longitude: 121.4452 },
    { id: 'sh-3', name: '上海第六人民医院', type: '三甲医院', distance: '5.5km', address: '上海市徐汇区宜山路600号', phone: '021-64369181', emergency: true, departments: ['骨科', '内分泌', '急诊'], rating: 4.6, waitTime: '约35分钟', openNow: true, latitude: 31.1835, longitude: 121.4257 },
    { id: 'sh-4', name: '静安区中心医院', type: '二甲医院', distance: '1.8km', address: '上海市静安区西康路259号', phone: '021-61578000', emergency: false, departments: ['全科', '内科', '儿科'], rating: 4.2, waitTime: '约20分钟', openNow: true, latitude: 31.2301, longitude: 121.4380 },
    { id: 'sh-5', name: '彭浦社区卫生服务中心', type: '社区诊所', distance: '0.8km', address: '上海市静安区共和新路4991号', phone: '021-56913203', emergency: false, departments: ['全科', '中医', '预防保健'], rating: 4.0, waitTime: '约10分钟', openNow: true, latitude: 31.2801, longitude: 121.4580 },
  ],
  '广州': [
    { id: 'gz-1', name: '广州中山大学附属第一医院', type: '三甲医院', distance: '4.0km', address: '广州市越秀区中山二路58号', phone: '020-28823388', emergency: true, departments: ['内科', '外科', '心血管', '肿瘤'], rating: 4.8, waitTime: '约60分钟', openNow: true, latitude: 23.1315, longitude: 113.2891 },
    { id: 'gz-2', name: '广东省人民医院', type: '三甲医院', distance: '3.5km', address: '广州市越秀区中山二路106号', phone: '020-83827812', emergency: true, departments: ['心内科', '呼吸', '消化', '急诊'], rating: 4.7, waitTime: '约45分钟', openNow: true, latitude: 23.1298, longitude: 113.2876 },
    { id: 'gz-3', name: '天河区中医院', type: '二甲医院', distance: '2.0km', address: '广州市天河区黄埔大道中201号', phone: '020-85661763', emergency: false, departments: ['中医科', '全科', '康复'], rating: 4.3, waitTime: '约15分钟', openNow: true, latitude: 23.1254, longitude: 113.3401 },
    { id: 'gz-4', name: '石牌社区卫生服务中心', type: '社区诊所', distance: '0.5km', address: '广州市天河区石牌东路', phone: '020-87577031', emergency: false, departments: ['全科', '预防保健'], rating: 4.0, waitTime: '约5分钟', openNow: true, latitude: 23.1301, longitude: 113.3501 },
  ],
  '深圳': [
    { id: 'sz-1', name: '深圳市人民医院', type: '三甲医院', distance: '3.8km', address: '深圳市罗湖区东门北路1017号', phone: '0755-25533018', emergency: true, departments: ['内科', '外科', '急诊', '儿科'], rating: 4.6, waitTime: '约40分钟', openNow: true, latitude: 22.5562, longitude: 114.1215 },
    { id: 'sz-2', name: '北大深圳医院', type: '三甲医院', distance: '5.0km', address: '深圳市福田区莲花路1120号', phone: '0755-83923333', emergency: true, departments: ['骨科', '妇产', '消化', '呼吸'], rating: 4.7, waitTime: '约50分钟', openNow: true, latitude: 22.5501, longitude: 114.0567 },
    { id: 'sz-3', name: '福田区第二人民医院', type: '二甲医院', distance: '1.5km', address: '深圳市福田区笋岗西路3002号', phone: '0755-83366388', emergency: false, departments: ['全科', '内科', '外科'], rating: 4.2, waitTime: '约20分钟', openNow: true, latitude: 22.5601, longitude: 114.0801 },
    { id: 'sz-4', name: '华富社区健康服务中心', type: '社区诊所', distance: '0.6km', address: '深圳市福田区华富路', phone: '0755-83061826', emergency: false, departments: ['全科', '预防保健', '中医'], rating: 4.0, waitTime: '约8分钟', openNow: true, latitude: 22.5451, longitude: 114.0651 },
  ],
  '杭州': [
    { id: 'hz-1', name: '浙江大学附属第一医院', type: '三甲医院', distance: '4.2km', address: '杭州市上城区庆春路79号', phone: '0571-87236114', emergency: true, departments: ['内科', '传染', '肝病', '急诊'], rating: 4.8, waitTime: '约55分钟', openNow: true, latitude: 30.2563, longitude: 120.1701 },
    { id: 'hz-2', name: '杭州市红十字会医院', type: '三甲医院', distance: '3.0km', address: '杭州市下城区环城东路208号', phone: '0571-56109588', emergency: true, departments: ['内科', '外科', '中医', '骨伤'], rating: 4.5, waitTime: '约30分钟', openNow: true, latitude: 30.2601, longitude: 120.1801 },
    { id: 'hz-3', name: '西湖区第二人民医院', type: '二甲医院', distance: '2.1km', address: '杭州市西湖区转塘街道', phone: '0571-87092301', emergency: false, departments: ['全科', '内科'], rating: 4.2, waitTime: '约15分钟', openNow: true, latitude: 30.2101, longitude: 120.1201 },
    { id: 'hz-4', name: '翠苑社区卫生服务中心', type: '社区诊所', distance: '0.7km', address: '杭州市西湖区学院路', phone: '0571-88823600', emergency: false, departments: ['全科', '中医', '预防'], rating: 4.1, waitTime: '约10分钟', openNow: true, latitude: 30.2801, longitude: 120.1301 },
  ],
};

/** Backward-compatible flat array (defaults to Beijing) */
export const hospitals: Hospital[] = HOSPITALS_BY_CITY['北京'];

export function getHospitalsByCity(city: string): Hospital[] {
  if (HOSPITALS_BY_CITY[city]) return HOSPITALS_BY_CITY[city];
  for (const [key, list] of Object.entries(HOSPITALS_BY_CITY)) {
    if (city.includes(key) || key.includes(city)) return list;
  }
  return HOSPITALS_BY_CITY['北京'];
}

export function getHospitalsByDepartment(hospitalList: Hospital[], departments: string[]): Hospital[] {
  if (departments.length === 0) return hospitalList;
  const matched = hospitalList.filter(h =>
    departments.some(dept => h.departments.some(hd => hd.includes(dept) || dept.includes(hd)))
  );
  return matched.length > 0 ? matched : hospitalList;
}

export function getRecommendedHospitals(level: RiskLevel, departments: string[]): Hospital[] {
  const deptLower = departments.map((d) => d.toLowerCase());

  const matchesDept = (h: Hospital) =>
    h.departments.some((d) => deptLower.some((rd) => d.includes(rd) || rd.includes(d)));

  switch (level) {
    case 'red': {
      const candidates = hospitals.filter(
        (h) => h.emergency && (h.type === '三甲医院' || h.type === '二甲医院' || h.type === '专科医院')
      );
      return candidates.slice(0, 3);
    }
    case 'orange': {
      const withEmergency = hospitals.filter((h) => h.emergency);
      const deptMatch = hospitals.filter((h) => matchesDept(h) && !h.emergency);
      const merged = [...new Map([...withEmergency, ...deptMatch].map((h) => [h.id, h])).values()];
      return merged.slice(0, 3);
    }
    case 'yellow': {
      const community = hospitals.filter((h) => h.type === '社区诊所');
      const secondary = hospitals.filter((h) => h.type === '二甲医院');
      const merged = [...community, ...secondary];
      return merged.slice(0, 3);
    }
    case 'green': {
      return hospitals.filter((h) => h.type === '社区诊所').slice(0, 2);
    }
  }
}