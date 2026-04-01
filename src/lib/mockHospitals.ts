import type { Hospital, RiskLevel } from '../types';

export const hospitals: Hospital[] = [
  // 三甲医院 (3)
  {
    id: '1',
    name: '北京协和医院',
    type: '三甲医院',
    distance: '2.3km',
    address: '北京市东城区帅府园1号',
    phone: '010-69156699',
    emergency: true,
    departments: ['急诊科', '内科', '外科', '心内科', '神经科', '呼吸科'],
    rating: 4.9,
    waitTime: '约90分钟',
    openNow: true,
    latitude: 39.9056,
    longitude: 116.4194,
  },
  {
    id: '2',
    name: '北京大学人民医院',
    type: '三甲医院',
    distance: '3.8km',
    address: '北京市西城区西直门南大街11号',
    phone: '010-88326666',
    emergency: true,
    departments: ['急诊科', '心内科', '骨科', '消化科', '肿瘤科', '儿科'],
    rating: 4.8,
    waitTime: '约60分钟',
    openNow: true,
    latitude: 39.9219,
    longitude: 116.3634,
  },
  {
    id: '3',
    name: '首都医科大学附属北京天坛医院',
    type: '三甲医院',
    distance: '1.5km',
    address: '北京市丰台区南四环西路119号',
    phone: '010-59978000',
    emergency: true,
    departments: ['神经科', '急诊科', '脑外科', '神经内科', '放射科', '内科'],
    rating: 4.7,
    waitTime: '约45分钟',
    openNow: true,
    latitude: 39.8637,
    longitude: 116.3972,
  },

  // 二甲医院 (3)
  {
    id: '4',
    name: '北京市朝阳区第二医院',
    type: '二甲医院',
    distance: '0.8km',
    address: '北京市朝阳区朝阳路1号',
    phone: '010-85958234',
    emergency: true,
    departments: ['内科', '外科', '妇产科', '儿科', '急诊科'],
    rating: 4.3,
    waitTime: '约30分钟',
    openNow: true,
    latitude: 39.9219,
    longitude: 116.4732,
  },
  {
    id: '5',
    name: '北京市海淀区中西医结合医院',
    type: '二甲医院',
    distance: '2.1km',
    address: '北京市海淀区玉泉路3号',
    phone: '010-68661122',
    emergency: true,
    departments: ['中医科', '内科', '外科', '急诊科', '骨科'],
    rating: 4.4,
    waitTime: '约20分钟',
    openNow: true,
    latitude: 39.9032,
    longitude: 116.3752,
  },
  {
    id: '6',
    name: '北京市石景山医院',
    type: '二甲医院',
    distance: '3.0km',
    address: '北京市石景山区五环路47号',
    phone: '010-57836000',
    emergency: false,
    departments: ['内科', '外科', '妇产科', '康复科', '口腔科'],
    rating: 4.2,
    waitTime: '约40分钟',
    openNow: true,
    latitude: 39.9112,
    longitude: 116.3482,
  },

  // 社区诊所 (4)
  {
    id: '7',
    name: '朝阳社区卫生服务中心',
    type: '社区诊所',
    distance: '0.3km',
    address: '北京市朝阳区望京街10号',
    phone: '010-64718866',
    emergency: false,
    departments: ['全科', '内科', '中医科'],
    rating: 4.1,
    waitTime: '约10分钟',
    openNow: true,
    latitude: 39.9219,
    longitude: 116.4432,
  },
  {
    id: '8',
    name: '海淀区中关村社区卫生站',
    type: '社区诊所',
    distance: '0.6km',
    address: '北京市海淀区中关村大街88号',
    phone: '010-82680012',
    emergency: false,
    departments: ['全科', '儿科', '内科'],
    rating: 4.0,
    waitTime: '约15分钟',
    openNow: true,
    latitude: 39.9840,
    longitude: 116.3178,
  },
  {
    id: '9',
    name: '东城区和平里社区卫生服务中心',
    type: '社区诊所',
    distance: '1.2km',
    address: '北京市东城区和平里东街16号',
    phone: '010-64284488',
    emergency: false,
    departments: ['全科', '中医科', '康复科'],
    rating: 4.2,
    waitTime: '约12分钟',
    openNow: false,
    latitude: 39.9547,
    longitude: 116.4201,
  },
  {
    id: '10',
    name: '西城区月坛社区卫生服务中心',
    type: '社区诊所',
    distance: '1.5km',
    address: '北京市西城区月坛北街26号',
    phone: '010-68015566',
    emergency: false,
    departments: ['全科', '内科', '妇科'],
    rating: 4.1,
    waitTime: '约20分钟',
    openNow: true,
    latitude: 39.9157,
    longitude: 116.3687,
  },

  // 专科医院 (2)
  {
    id: '11',
    name: '北京心血管病医院',
    type: '专科医院',
    distance: '2.0km',
    address: '北京市西城区长安街甲10号',
    phone: '010-88398800',
    emergency: true,
    departments: ['心内科', '心外科', '急诊科', '血管科', '重症医学科'],
    rating: 4.8,
    waitTime: '约50分钟',
    openNow: true,
    latitude: 39.9023,
    longitude: 116.3798,
  },
  {
    id: '12',
    name: '北京儿童医院',
    type: '专科医院',
    distance: '4.8km',
    address: '北京市西城区南礼士路56号',
    phone: '010-59616161',
    emergency: true,
    departments: ['儿科', '急诊科', '小儿外科', '儿童保健科', '新生儿科'],
    rating: 4.9,
    waitTime: '约75分钟',
    openNow: true,
    latitude: 39.9078,
    longitude: 116.3562,
  },
];

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
