export interface OTCDrug {
  id: string;
  name: string;
  genericName: string;
  spec: string;
  priceRange: [number, number];
  category: string;
  jdKeyword: string;
  usage: string;
  warnings: string;
}

export const OTC_DRUG_DB: OTCDrug[] = [
  // 退烧止痛
  { id: 'acetaminophen', name: '对乙酰氨基酚', genericName: '对乙酰氨基酚片', spec: '500mg×24片', priceRange: [8, 15], category: '退烧止痛', jdKeyword: '对乙酰氨基酚片 OTC', usage: '成人每次500mg，每4-6小时一次，每日不超过2g', warnings: '肝功能不全慎用，不与含相同成分感冒药同服' },
  { id: 'ibuprofen', name: '布洛芬', genericName: '布洛芬缓释胶囊', spec: '300mg×20粒', priceRange: [12, 25], category: '退烧止痛', jdKeyword: '布洛芬缓释胶囊 OTC', usage: '成人每次300mg，每日2次，饭后服用', warnings: '胃溃疡、肾功能不全、孕晚期禁用' },
  // 感冒
  { id: 'ganmaolin', name: '感冒灵颗粒', genericName: '感冒灵颗粒', spec: '10g×10袋', priceRange: [10, 18], category: '感冒', jdKeyword: '感冒灵颗粒', usage: '开水冲服，一次1袋，一日3次', warnings: '含对乙酰氨基酚，不与同类退烧药合用' },
  { id: 'lianhua', name: '连花清瘟', genericName: '连花清瘟胶囊', spec: '0.35g×48粒', priceRange: [15, 28], category: '感冒', jdKeyword: '连花清瘟胶囊', usage: '一次4粒，一日3次', warnings: '风寒感冒不适用，孕妇禁用' },
  { id: 'banlangen', name: '板蓝根颗粒', genericName: '板蓝根颗粒', spec: '10g×20袋', priceRange: [12, 22], category: '感冒', jdKeyword: '板蓝根颗粒', usage: '开水冲服，一次1-2袋，一日3-4次', warnings: '脾胃虚寒者慎用' },
  // 抗过敏
  { id: 'loratadine', name: '氯雷他定', genericName: '氯雷他定片', spec: '10mg×6片', priceRange: [8, 16], category: '抗过敏', jdKeyword: '氯雷他定片 OTC', usage: '每日1次，每次10mg', warnings: '嗜睡概率低但仍需注意驾车' },
  { id: 'cetirizine', name: '西替利嗪', genericName: '盐酸西替利嗪片', spec: '10mg×12片', priceRange: [10, 20], category: '抗过敏', jdKeyword: '西替利嗪片 OTC', usage: '每日1次，每次10mg', warnings: '可能引起轻度嗜睡' },
  // 消化
  { id: 'montmorillonite', name: '蒙脱石散', genericName: '蒙脱石散', spec: '3g×10袋', priceRange: [15, 28], category: '止泻', jdKeyword: '蒙脱石散', usage: '空腹服用，成人每次1袋，一日3次', warnings: '与其他药物间隔2小时服用' },
  { id: 'ors', name: '口服补液盐', genericName: '口服补液盐III', spec: '5.125g×20袋', priceRange: [8, 15], category: '补液', jdKeyword: '口服补液盐 OTC', usage: '温开水溶解后少量多次饮用', warnings: '严重脱水应静脉补液' },
  { id: 'probiotics', name: '益生菌', genericName: '双歧杆菌活菌制剂', spec: '30粒', priceRange: [35, 68], category: '消化', jdKeyword: '益生菌 成人', usage: '每日1-2次，每次1粒', warnings: '勿与抗生素同服，间隔2小时' },
  { id: 'jianwei', name: '健胃消食片', genericName: '健胃消食片', spec: '0.5g×32片', priceRange: [8, 15], category: '消化', jdKeyword: '健胃消食片', usage: '饭后咀嚼，一次4片，一日3次', warnings: '糖尿病患者注意含糖' },
  // 止咳
  { id: 'chuanbei', name: '川贝枇杷膏', genericName: '川贝枇杷膏', spec: '300ml', priceRange: [25, 45], category: '止咳', jdKeyword: '川贝枇杷膏', usage: '每日3次，每次15ml', warnings: '糖尿病患者慎用(含糖)' },
  // 外用
  { id: 'calamine', name: '炉甘石洗剂', genericName: '炉甘石洗剂', spec: '100ml', priceRange: [5, 12], category: '外用', jdKeyword: '炉甘石洗剂', usage: '外用，摇匀后涂患处，一日2-3次', warnings: '皮肤破损处禁用' },
  { id: 'yunnanbaiyao', name: '云南白药喷雾', genericName: '云南白药气雾剂', spec: '50g+85g', priceRange: [35, 55], category: '外用', jdKeyword: '云南白药气雾剂', usage: '先喷红瓶(保险液)再喷白瓶，一日3次', warnings: '孕妇禁用，皮肤破损慎用' },
  { id: 'painpatch', name: '止痛贴', genericName: '云南白药膏', spec: '6贴', priceRange: [15, 28], category: '外用', jdKeyword: '止痛贴 膏药', usage: '贴患处，每日1次', warnings: '皮肤过敏者慎用' },
  // 其他
  { id: 'vitc', name: '维生素C', genericName: '维生素C片', spec: '100mg×100片', priceRange: [5, 12], category: '营养', jdKeyword: '维生素C片', usage: '每日1-2次，每次100mg', warnings: '大剂量长期服用可能致草酸尿结石' },
  { id: 'electrolyte', name: '电解质水', genericName: '电解质固体饮料', spec: '500ml×12瓶', priceRange: [30, 50], category: '补液', jdKeyword: '电解质水', usage: '少量多次饮用', warnings: '高血压患者注意钠含量' },
  { id: 'thermometer', name: '体温计', genericName: '电子体温计', spec: '1支', priceRange: [15, 35], category: '器械', jdKeyword: '电子体温计', usage: '腋下测量5分钟', warnings: '定期校准' },
  { id: 'mask', name: '医用口罩', genericName: '一次性医用外科口罩', spec: '50只', priceRange: [10, 25], category: '防护', jdKeyword: '医用外科口罩', usage: '佩戴4小时更换', warnings: '潮湿后应立即更换' },
];

export function findDrugByName(name: string): OTCDrug | undefined {
  return OTC_DRUG_DB.find(d =>
    d.name === name || d.genericName.includes(name) || name.includes(d.name)
  );
}
