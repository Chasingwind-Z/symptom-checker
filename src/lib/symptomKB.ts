import type { RiskLevel, SymptomInfo } from '../types';

export interface ChineseOTCDrug {
  name: string;
  aliases: string[];
  indications: string[];
  contraindications: string[];
  interactions: string[];
  category: string;
}

export const CHINESE_OTC_DRUGS: ChineseOTCDrug[] = [
  { name: '藿香正气水', aliases: ['藿香正气液','藿香正气口服液'], indications: ['中暑','胃肠感冒','恶心呕吐','腹胀腹泻'], contraindications: ['酒精过敏'], interactions: ['头孢类抗生素'], category: '消化' },
  { name: '板蓝根颗粒', aliases: ['板蓝根'], indications: ['风热感冒','咽喉肿痛','扁桃体炎'], contraindications: ['脾胃虚寒'], interactions: [], category: '感冒' },
  { name: '连花清瘟胶囊', aliases: ['连花清瘟'], indications: ['流感','发热','咳嗽','肌肉酸痛'], contraindications: ['孕妇'], interactions: ['退烧药(对乙酰氨基酚)'], category: '感冒' },
  { name: '小柴胡颗粒', aliases: ['小柴胡'], indications: ['感冒少阳证','寒热往来','胸胁苦满','食欲不振'], contraindications: [], interactions: [], category: '感冒' },
  { name: '六味地黄丸', aliases: ['六味地黄'], indications: ['肾阴虚','腰膝酸软','头晕耳鸣','盗汗'], contraindications: ['脾胃虚弱','消化不良'], interactions: [], category: '补益' },
  { name: '逍遥丸', aliases: ['逍遥散'], indications: ['肝郁脾虚','月经不调','胸闷','情绪低落'], contraindications: ['孕妇'], interactions: [], category: '调理' },
  { name: '金银花露', aliases: ['金银花'], indications: ['上火','口腔溃疡','咽痛','热毒'], contraindications: ['脾胃虚寒'], interactions: [], category: '清热' },
  { name: '蒲地蓝消炎口服液', aliases: ['蒲地蓝'], indications: ['咽炎','扁桃体炎','口腔炎','腮腺炎'], contraindications: [], interactions: [], category: '消炎' },
  { name: '健胃消食片', aliases: ['健胃消食'], indications: ['消化不良','食欲不振','腹胀','积食'], contraindications: [], interactions: [], category: '消化' },
  { name: '保和丸', aliases: [], indications: ['食积停滞','腹胀','嗳气','大便不调'], contraindications: [], interactions: [], category: '消化' },
  { name: '复方丹参滴丸', aliases: ['丹参滴丸'], indications: ['胸闷','心绞痛','冠心病辅助'], contraindications: ['出血倾向'], interactions: ['抗凝药'], category: '心血管' },
  { name: '速效救心丸', aliases: [], indications: ['心绞痛急性发作','胸闷气短'], contraindications: [], interactions: ['硝酸甘油'], category: '心血管' },
  { name: '牛黄解毒片', aliases: ['牛黄解毒'], indications: ['上火','牙龈肿痛','口舌生疮','便秘'], contraindications: ['孕妇','长期服用'], interactions: [], category: '清热' },
  { name: '三九感冒灵', aliases: ['感冒灵颗粒','感冒灵'], indications: ['感冒','头痛','鼻塞','流涕','咽痛'], contraindications: [], interactions: ['对乙酰氨基酚(成分重复)'], category: '感冒' },
  { name: '双黄连口服液', aliases: ['双黄连'], indications: ['风热感冒','发热','咳嗽','咽痛'], contraindications: ['风寒感冒'], interactions: [], category: '感冒' },
  { name: '清开灵颗粒', aliases: ['清开灵'], indications: ['上呼吸道感染','病毒性感冒','高热'], contraindications: ['脾胃虚寒','孕妇'], interactions: [], category: '感冒' },
  { name: '银翘解毒片', aliases: ['银翘'], indications: ['风热感冒初期','咽痛','微恶风寒'], contraindications: [], interactions: [], category: '感冒' },
  { name: '午时茶颗粒', aliases: ['午时茶'], indications: ['暑湿感冒','胃肠感冒','恶心呕吐'], contraindications: [], interactions: [], category: '感冒' },
  { name: '香砂养胃丸', aliases: ['香砂养胃'], indications: ['胃痛','胃胀','消化不良','食欲差'], contraindications: [], interactions: [], category: '消化' },
  { name: '胃苏颗粒', aliases: ['胃苏'], indications: ['胃脘胀痛','嗳气','反酸'], contraindications: [], interactions: [], category: '消化' },
  { name: '安神补脑液', aliases: [], indications: ['失眠','神经衰弱','头晕','健忘'], contraindications: ['实热证'], interactions: ['镇静药'], category: '安神' },
  { name: '天王补心丹', aliases: [], indications: ['心悸','失眠','多梦','健忘'], contraindications: ['脾胃虚弱'], interactions: [], category: '安神' },
  { name: '云南白药', aliases: ['云南白药气雾剂','云南白药膏'], indications: ['跌打损伤','淤血肿痛','出血'], contraindications: ['孕妇'], interactions: ['抗凝药'], category: '外伤' },
  { name: '正骨水', aliases: [], indications: ['跌打扭伤','肌肉酸痛','关节疼痛'], contraindications: ['皮肤破损'], interactions: [], category: '外伤' },
  { name: '风油精', aliases: [], indications: ['蚊虫叮咬','头痛头晕','晕车','鼻塞'], contraindications: ['婴幼儿','皮肤破损'], interactions: [], category: '外用' },
  { name: '皮炎平', aliases: ['复方醋酸地塞米松'], indications: ['皮炎','湿疹','皮肤瘙痒'], contraindications: ['真菌感染','长期使用'], interactions: [], category: '皮肤' },
  { name: '马应龙痔疮膏', aliases: ['马应龙'], indications: ['痔疮','肛裂','肛周瘙痒'], contraindications: ['孕妇'], interactions: [], category: '肛肠' },
  { name: '川贝枇杷膏', aliases: ['川贝枇杷','念慈菴'], indications: ['咳嗽','咽干','痰多'], contraindications: ['糖尿病(含糖)'], interactions: [], category: '止咳' },
  { name: '急支糖浆', aliases: [], indications: ['急性支气管炎','咳嗽','痰黄'], contraindications: ['糖尿病'], interactions: [], category: '止咳' },
  { name: '通宣理肺丸', aliases: ['通宣理肺'], indications: ['风寒咳嗽','鼻塞流涕','头痛'], contraindications: ['风热咳嗽'], interactions: [], category: '止咳' },
];

export const SEASONAL_SYMPTOM_PATTERNS: Record<number, { keywords: string[]; context: string }> = {
  0: { keywords: ['流感','感冒','咳嗽','发烧'], context: '当前为冬季流感高发期' },
  1: { keywords: ['流感','感冒','咳嗽'], context: '冬末流感仍活跃' },
  2: { keywords: ['过敏','花粉','鼻炎','打喷嚏'], context: '春季花粉过敏高发' },
  3: { keywords: ['过敏','花粉','鼻炎','皮疹'], context: '春季过敏症状高峰' },
  4: { keywords: ['过敏','紫外线','晒伤'], context: '初夏过敏和紫外线风险' },
  5: { keywords: ['中暑','腹泻','食物中毒','胃肠'], context: '夏季肠胃疾病和中暑风险增加' },
  6: { keywords: ['中暑','腹泻','空调病','热射病'], context: '盛夏中暑高发' },
  7: { keywords: ['中暑','腹泻','蚊虫叮咬'], context: '高温季节注意防暑和食品安全' },
  8: { keywords: ['干燥','咽炎','皮肤干','鼻出血'], context: '秋季干燥，呼吸道和皮肤问题增多' },
  9: { keywords: ['干燥','咽炎','过敏','感冒'], context: '秋季换季感冒增多' },
  10: { keywords: ['感冒','流感','咳嗽','支气管炎'], context: '入冬流感季开始' },
  11: { keywords: ['流感','感冒','冻伤','干燥'], context: '冬季流感高峰，注意保暖' },
};

interface RawSymptomInfo extends Omit<SymptomInfo, 'id' | 'default_min_level'> {
  default_min_level: '轻度' | '中度' | '重度';
}

const rawSymptomKB: RawSymptomInfo[] = [
  {
    name: "发烧",
    aliases: ["发烧", "发热", "高烧", "低烧", "体温升高", "退烧", "烧退"],
    danger_signs: ["体温超过39.5°C", "高热惊厥", "伴意识障碍", "热程超过3天无好转"],
    departments: ["内科", "急诊科", "感染科"],
    self_care: ["多喝水", "物理降温（温水擦浴）", "适当休息", "体温38.5°C以上可服用退烧药"],
    when_to_worry: "体温持续超过39°C超过24小时，或伴随剧烈头痛、皮疹、意识障碍时，应立即就医。",
    default_min_level: "中度",
    source: "参考：中国卫健委《发热诊疗指南》",
  },
  {
    name: "咳嗽",
    aliases: ["咳嗽", "干咳", "咳痰", "痰多", "咳血", "剧烈咳嗽", "久咳", "慢性咳嗽"],
    danger_signs: ["咳血", "呼吸困难", "持续咳嗽超过3周", "咳嗽伴高热"],
    departments: ["呼吸科", "内科", "耳鼻喉科"],
    self_care: ["保持室内湿润", "多喝温水", "避免刺激性气体", "蜂蜜水缓解干咳"],
    when_to_worry: "咳嗽持续超过3周、痰中带血、伴随呼吸困难或体重明显下降时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会《咳嗽诊断与治疗指南》",
  },
  {
    name: "头痛",
    aliases: ["头痛", "头疼", "偏头痛", "头胀", "头部疼痛", "头顶痛", "后脑痛", "太阳穴痛"],
    danger_signs: ["突发剧烈头痛（雷击样）", "伴发热颈强直", "视力改变", "意识障碍", "头痛伴呕吐"],
    departments: ["神经内科", "内科", "急诊科"],
    self_care: ["休息避光", "冷热敷", "保持充足睡眠", "适当按摩太阳穴"],
    when_to_worry: "突发剧烈头痛、头痛伴发热和颈部僵硬、伴随肢体无力或语言障碍时，需立即就医。",
    default_min_level: "中度",
    source: "参考：国际头痛协会分类标准 ICHD-3",
  },
  {
    name: "胸痛",
    aliases: ["胸痛", "胸闷", "胸部疼痛", "心口痛", "前胸痛", "胸部压迫感", "胸口痛"],
    danger_signs: ["胸痛伴左臂放射痛", "大汗淋漓", "呼吸困难", "持续超过15分钟", "胸痛伴晕厥"],
    departments: ["心内科", "急诊科", "胸外科"],
    self_care: ["立即休息，避免活动", "松开衣领", "如有硝酸甘油可含服"],
    when_to_worry: "任何急性胸痛均应视为紧急情况，尤其伴随出汗、左臂痛、呼吸困难时，应立即拨打急救电话。",
    default_min_level: "重度",
    source: "参考：美国心脏协会 AHA 急性胸痛评估指南",
  },
  {
    name: "腹痛",
    aliases: ["腹痛", "肚子痛", "胃痛", "腹部疼痛", "肚痛", "绞痛", "腹绞痛", "胃部不适", "下腹痛", "上腹痛"],
    danger_signs: ["腹痛剧烈且持续", "腹部板状硬", "伴高热", "呕血或便血", "腹痛伴休克症状"],
    departments: ["消化内科", "普通外科", "急诊科"],
    self_care: ["热敷缓解痉挛性疼痛", "禁食静养", "避免使用止痛药以免掩盖症状"],
    when_to_worry: "腹痛持续超过6小时无缓解、痛感剧烈或腹部变硬、伴随发热或呕血时，应立即就医。",
    default_min_level: "中度",
    source: "参考：《外科学》第9版腹痛鉴别诊断",
  },
  {
    name: "呼吸困难",
    aliases: ["呼吸困难", "气短", "喘不过气", "憋气", "胸闷气短", "呼吸急促", "气喘", "喘息", "透不过气"],
    danger_signs: ["静息状态下呼吸困难", "嘴唇发紫", "血氧饱和度低于90%", "伴胸痛", "突发严重呼吸困难"],
    departments: ["急诊科", "呼吸科", "心内科"],
    self_care: ["保持半坐位", "保持环境通风", "避免剧烈活动"],
    when_to_worry: "任何突发严重呼吸困难、嘴唇或指甲发紫、静坐时也喘不过气，均需立即拨打急救电话。",
    default_min_level: "重度",
    source: "参考：中华医学会呼吸病学分会《呼吸困难诊断与处理专家共识》",
  },
  {
    name: "乏力",
    aliases: ["乏力", "疲劳", "疲乏", "无力", "倦怠", "虚弱", "精神差", "没精神", "浑身没劲"],
    danger_signs: ["极度乏力无法活动", "伴随黄疸", "体重明显下降", "乏力持续超过2周"],
    departments: ["内科", "血液科", "内分泌科"],
    self_care: ["保证充足睡眠", "均衡饮食", "适量运动", "减少压力"],
    when_to_worry: "乏力持续2周以上无改善、伴随不明原因体重下降、皮肤发黄或呼吸困难时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：《内科学》第9版疲劳与乏力鉴别诊断",
  },
  {
    name: "头晕",
    aliases: ["头晕", "眩晕", "晕眩", "天旋地转", "头昏", "站不稳", "头重脚轻", "晕", "平衡障碍"],
    danger_signs: ["突发剧烈眩晕伴呕吐", "头晕伴肢体无力", "头晕伴言语不清", "反复发作"],
    departments: ["神经内科", "耳鼻喉科", "内科"],
    self_care: ["立即坐下或躺下", "避免突然起身", "闭眼休息", "补充水分"],
    when_to_worry: "头晕伴随单侧肢体无力、言语困难、视力模糊或面部麻木时，可能是脑卒中先兆，须立即就医。",
    default_min_level: "中度",
    source: "参考：Bárány协会前庭疾病国际分类标准",
  },
  {
    name: "恶心呕吐",
    aliases: ["恶心", "呕吐", "恶心呕吐", "想吐", "干呕", "呕逆", "反胃", "恶心感", "吐", "作呕"],
    danger_signs: ["呕血", "严重脱水征象", "剧烈腹痛伴呕吐", "头痛剧烈伴呕吐", "持续24小时以上"],
    departments: ["消化内科", "急诊科", "内科"],
    self_care: ["少量多次饮水防脱水", "暂时禁食", "清淡饮食", "生姜茶缓解恶心"],
    when_to_worry: "呕吐物含血、呕吐持续超过24小时、伴随剧烈腹痛或头痛、无法补充水分时，应及时就医。",
    default_min_level: "中度",
    source: "参考：中华医学会消化病学分会《恶心呕吐诊治专家共识》",
  },
  {
    name: "腹泻",
    aliases: ["腹泻", "拉肚子", "水样便", "稀便", "频繁排便", "肠胃不适", "急性腹泻", "慢性腹泻"],
    danger_signs: ["血便", "脓血便", "严重脱水（口干极渴、尿少）", "高热伴腹泻", "持续超过3天"],
    departments: ["消化内科", "感染科", "内科"],
    self_care: ["补充口服补液盐", "清淡饮食（米粥、面条）", "避免乳制品和油腻食物"],
    when_to_worry: "腹泻超过3天、大便带血或脓、伴随高热或严重脱水症状时，应及时就医。",
    default_min_level: "中度",
    source: "参考：WHO《腹泻病治疗指南》",
  },
  {
    name: "皮疹",
    aliases: ["皮疹", "皮肤疹子", "红疹", "皮肤红点", "荨麻疹", "皮炎", "过敏疹", "斑疹", "丘疹", "皮肤起疹"],
    danger_signs: ["皮疹伴呼吸困难（过敏反应）", "皮疹迅速扩散全身", "出血性皮疹（紫癜）", "皮疹伴高热"],
    departments: ["皮肤科", "变态反应科", "急诊科"],
    self_care: ["避免搔抓", "穿宽松透气衣物", "远离已知过敏原", "冷水敷可缓解瘙痒"],
    when_to_worry: "皮疹伴随呼吸困难或喉咙肿胀（过敏休克先兆）、皮疹为出血点或瘀斑、伴随高热不退时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会皮肤性病学分会《荨麻疹诊疗指南》",
  },
  {
    name: "关节痛",
    aliases: ["关节痛", "关节疼痛", "关节肿痛", "膝盖痛", "手指痛", "关节炎", "骨关节痛", "关节僵硬", "关节红肿"],
    danger_signs: ["关节突然红肿热痛伴发热", "外伤后关节变形", "关节痛影响日常活动"],
    departments: ["骨科", "风湿科", "内科"],
    self_care: ["适当休息关节", "冷热交替敷", "适度低强度运动维持活动度", "减轻体重减少关节负担"],
    when_to_worry: "关节突发剧烈红肿热痛伴发热（可能是化脓性关节炎）、外伤后关节畸形时，应立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会风湿病学分会《类风湿关节炎诊疗指南》",
  },
  {
    name: "眼部不适",
    aliases: ["眼部不适", "眼痛", "眼红", "视力模糊", "眼睛充血", "结膜炎", "眼睛痒", "流泪", "眼分泌物多", "眼花", "眼涩"],
    danger_signs: ["突然视力丧失", "眼外伤", "眼内异物", "持续眼痛伴头痛恶心（急性青光眼）"],
    departments: ["眼科", "急诊科"],
    self_care: ["避免揉眼", "避免强光刺激", "使用人工泪液缓解干涩", "注意用眼卫生"],
    when_to_worry: "突然单眼或双眼视力下降、眼痛剧烈伴头痛呕吐、眼部受伤时，需立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会眼科学分会《眼科急症诊疗规范》",
  },
  {
    name: "耳鸣",
    aliases: ["耳鸣", "耳朵嗡嗡响", "耳鸣耳聋", "听力下降", "耳痛", "耳朵响", "耳道不适", "耳聋"],
    danger_signs: ["突发单侧耳聋", "耳鸣伴剧烈眩晕", "耳道流脓或出血", "耳鸣伴头痛"],
    departments: ["耳鼻喉科", "神经内科"],
    self_care: ["避免噪音环境", "减少咖啡因摄入", "保证充足睡眠", "减轻精神压力"],
    when_to_worry: "突然出现单侧耳鸣或听力骤降（突发性耳聋）、耳道流脓或出血时，应立即就医（突发性耳聋须48小时内治疗）。",
    default_min_level: "轻度",
    source: "参考：中华医学会耳鼻咽喉头颈外科学分会《突发性聋诊断和治疗指南》",
  },
  {
    name: "心悸",
    aliases: ["心悸", "心慌", "心跳加速", "心跳不规律", "胸闷心跳", "心跳过快", "心律不齐", "心跳漏跳", "心慌意乱"],
    danger_signs: ["心悸伴胸痛", "心悸伴晕厥", "心悸伴严重呼吸困难", "心率持续超过150次/分"],
    departments: ["心内科", "急诊科"],
    self_care: ["深呼吸放松", "避免咖啡因和烟酒", "保证充足睡眠", "尝试迷走神经刺激（屏气用力）"],
    when_to_worry: "心悸伴随胸痛、晕厥或接近晕厥、持续性心跳异常快（超过150次/分）时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会心血管病学分会《心律失常诊疗指南》",
  },
  {
    name: "背痛",
    aliases: ["背痛", "腰痛", "背部疼痛", "腰背痛", "脊背痛", "肩背痛", "腰酸背痛", "下腰痛", "腰肌劳损"],
    danger_signs: ["背痛伴大小便失控", "外伤后背痛", "持续性夜间背痛", "背痛伴腿部麻木无力"],
    departments: ["骨科", "脊柱外科", "疼痛科"],
    self_care: ["热敷放松肌肉", "适当卧床休息", "避免长时间弯腰", "核心肌群锻炼"],
    when_to_worry: "背痛伴随下肢麻木无力、大小便功能障碍（马尾综合征）、外伤后背痛时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：ACP《急性与慢性腰背痛无创治疗指南》",
  },
  {
    name: "喉咙痛",
    aliases: ["喉咙痛", "咽喉痛", "嗓子痛", "咽痛", "吞咽痛", "喉咙不适", "咽喉炎", "扁桃体痛", "咽干"],
    danger_signs: ["喉咙痛伴呼吸困难", "无法吞咽唾液", "喉咙痛伴高热超过39°C", "颈部肿胀明显"],
    departments: ["耳鼻喉科", "内科", "急诊科"],
    self_care: ["盐水漱口", "多喝温水", "含服润喉糖", "蜂蜜水缓解"],
    when_to_worry: "喉咙痛导致无法吞咽、伴呼吸困难或口水外流、颈部严重肿胀（可能是会厌炎）时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会《急性咽炎与扁桃体炎诊疗指南》",
  },
  {
    name: "鼻塞",
    aliases: ["鼻塞", "鼻子不通", "鼻涕", "流鼻涕", "鼻塞流涕", "鼻窦炎", "过敏性鼻炎", "鼻腔堵塞", "鼻子堵"],
    danger_signs: ["鼻塞伴高热头痛超过1周", "鼻涕带血", "单侧持续性鼻塞伴嗅觉丧失"],
    departments: ["耳鼻喉科", "变态反应科"],
    self_care: ["生理盐水鼻腔冲洗", "蒸汽吸入", "抬高枕头睡眠", "避免接触过敏原"],
    when_to_worry: "鼻塞持续超过2周无改善、单侧鼻塞伴鼻涕带血或嗅觉消失、伴严重头痛时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会耳鼻咽喉头颈外科学分会《变应性鼻炎诊断和治疗指南》",
  },
  {
    name: "水肿",
    aliases: ["水肿", "浮肿", "下肢肿", "脚肿", "腿肿", "眼睑浮肿", "全身水肿", "局部肿胀", "肿胀"],
    danger_signs: ["突发单侧下肢肿胀伴疼痛（可能血栓）", "全身性水肿伴呼吸困难", "眼睑及颜面水肿伴尿少"],
    departments: ["心内科", "肾内科", "血管外科"],
    self_care: ["抬高下肢", "减少盐分摄入", "适度活动促进血液循环", "穿弹力袜"],
    when_to_worry: "单侧下肢突然肿胀红痛（深静脉血栓）、水肿伴呼吸困难、全身水肿伴尿量明显减少时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会心血管病学分会《心力衰竭诊断和治疗指南》",
  },
  {
    name: "意识改变",
    aliases: ["意识改变", "意识障碍", "昏迷", "意识不清", "神志不清", "谵妄", "嗜睡", "反应迟钝", "叫不醒", "昏厥", "晕倒"],
    danger_signs: ["无法唤醒", "肢体抽搐", "呼吸异常", "伴随颈部僵硬发热", "头部外伤后意识改变"],
    departments: ["急诊科", "神经内科", "ICU"],
    self_care: ["立即拨打急救电话120", "保持气道通畅", "侧卧防误吸", "不要给意识不清者喂食"],
    when_to_worry: "任何程度的意识障碍均属急症，应立即拨打120急救电话，同时保持患者气道通畅并等待急救人员。",
    default_min_level: "重度",
    source: "参考：中华医学会神经病学分会《意识障碍诊断与处理专家共识》",
  },
  // ── 以下为新增条目 ──
  {
    name: "眼部红痒",
    aliases: ["眼部红痒", "眼睛红痒", "眼痒", "过敏性结膜炎", "眼红痒", "眼睛发痒", "结膜红肿"],
    danger_signs: ["视力急剧下降", "眼痛剧烈伴分泌物增多", "眼红伴畏光流泪持续超过3天"],
    departments: ["眼科", "变态反应科"],
    self_care: ["冷敷眼部缓解瘙痒", "避免揉眼", "远离粉尘花粉等过敏原", "使用人工泪液冲洗"],
    when_to_worry: "眼红痒伴视力下降、大量脓性分泌物、或症状持续加重超过3天时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会眼科学分会《过敏性结膜炎诊疗专家共识》",
  },
  {
    name: "牙痛",
    aliases: ["牙痛", "牙疼", "牙齿痛", "牙龈肿痛", "智齿痛", "蛀牙痛", "牙髓炎", "牙周脓肿", "牙酸"],
    danger_signs: ["牙痛伴面部肿胀扩散", "张口受限", "牙痛伴发热寒战", "外伤致牙齿脱落"],
    departments: ["口腔科", "口腔急诊", "颌面外科"],
    self_care: ["温盐水漱口", "冷敷面部缓解肿痛", "避免过冷过热食物", "可服用布洛芬临时止痛"],
    when_to_worry: "牙痛伴面部广泛肿胀、发热、张口困难（可能间隙感染）、或外伤牙脱位时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：中华口腔医学会《牙体牙髓病诊疗指南》",
  },
  {
    name: "肌肉抽搐",
    aliases: ["肌肉抽搐", "肌肉痉挛", "抽筋", "腿抽筋", "肌肉跳动", "肌束颤动", "小腿痉挛", "肌肉不自主跳动"],
    danger_signs: ["全身性肌肉抽搐（癫痫发作）", "抽搐伴意识丧失", "抽搐持续超过5分钟", "频繁发作"],
    departments: ["神经内科", "急诊科", "骨科"],
    self_care: ["轻柔拉伸抽搐肌肉", "热敷或按摩", "补充钙镁等矿物质", "保持充足水分"],
    when_to_worry: "抽搐伴意识丧失、持续超过5分钟不缓解、反复频繁发作、或伴肢体无力时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会神经病学分会《癫痫诊疗指南》",
  },
  {
    name: "尿频尿急",
    aliases: ["尿频尿急", "尿频", "尿急", "尿痛", "排尿困难", "夜尿多", "尿道灼热", "小便频繁", "尿路感染"],
    danger_signs: ["血尿", "尿痛伴高热寒战", "排尿完全困难（尿潴留）", "腰痛伴发热"],
    departments: ["泌尿外科", "肾内科", "妇科"],
    self_care: ["大量饮水", "不要憋尿", "注意个人卫生", "穿棉质宽松内衣"],
    when_to_worry: "尿频尿急伴血尿、高热寒战（可能肾盂肾炎）、或完全无法排尿时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会泌尿外科学分会《尿路感染诊断与治疗指南》",
  },
  {
    name: "胸闷",
    aliases: ["胸闷", "胸口发闷", "气短胸闷", "胸部憋闷", "闷气", "呼吸不畅", "胸部压迫感", "喘不上来气"],
    danger_signs: ["胸闷伴剧烈胸痛", "胸闷伴大汗", "胸闷伴嘴唇发紫", "活动后胸闷明显加重"],
    departments: ["心内科", "呼吸科", "急诊科"],
    self_care: ["保持安静休息", "开窗通风", "松开紧身衣物", "深慢呼吸"],
    when_to_worry: "胸闷伴随胸痛、大汗、嘴唇发紫、或安静时仍感明显胸闷加重时，应立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会心血管病学分会《稳定性冠心病诊断与治疗指南》",
  },
  {
    name: "手脚麻木",
    aliases: ["手脚麻木", "手麻", "脚麻", "肢体麻木", "四肢麻木", "手指麻木", "脚趾麻木", "感觉异常", "针刺感"],
    danger_signs: ["单侧肢体突然麻木（卒中征兆）", "麻木伴肌力下降", "麻木范围进行性扩大", "伴言语不清"],
    departments: ["神经内科", "骨科", "内分泌科"],
    self_care: ["改变姿势活动肢体", "避免长时间压迫", "适当温水泡手脚", "控制血糖"],
    when_to_worry: "突发单侧肢体麻木伴面部歪斜或言语不清（卒中征兆）、麻木范围持续扩大时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会神经病学分会《中国脑血管病防治指南》",
  },
  {
    name: "记忆力下降",
    aliases: ["记忆力下降", "健忘", "记不住事", "认知减退", "注意力不集中", "反应变慢", "思维迟钝", "老忘事"],
    danger_signs: ["短期内记忆力急剧下降", "迷路找不到回家的路", "无法完成熟悉的日常任务", "伴人格行为改变"],
    departments: ["神经内科", "精神科", "老年科"],
    self_care: ["保持社交活动", "规律作息", "进行脑力锻炼（阅读、下棋）", "均衡饮食"],
    when_to_worry: "记忆力在数周内明显下降、影响日常生活独立能力、伴有人格改变或方向感丧失时，应及时就医评估。",
    default_min_level: "轻度",
    source: "参考：中华医学会神经病学分会《阿尔茨海默病诊疗指南》",
  },
  {
    name: "食欲不振",
    aliases: ["食欲不振", "不想吃饭", "没胃口", "厌食", "食欲减退", "吃不下饭", "胃口差", "不饿"],
    danger_signs: ["持续2周以上食欲不振伴体重下降", "伴腹痛黄疸", "伴发热盗汗", "进食后反复呕吐"],
    departments: ["消化内科", "内科", "肿瘤科"],
    self_care: ["少量多餐", "选择清淡易消化食物", "适量运动促进食欲", "保持心情愉快"],
    when_to_worry: "食欲不振持续超过2周伴体重明显下降、黄疸或持续发热时，应及时就医排查。",
    default_min_level: "轻度",
    source: "参考：中华医学会消化病学分会《功能性消化不良诊治专家共识》",
  },
  {
    name: "体重骤变",
    aliases: ["体重骤变", "体重骤降", "暴瘦", "突然变胖", "不明原因消瘦", "体重减轻", "体重增加", "快速瘦了"],
    danger_signs: ["6个月内体重下降超过10%", "体重骤降伴盗汗发热", "体重增加伴水肿呼吸困难", "伴甲状腺肿大"],
    departments: ["内分泌科", "肿瘤科", "消化内科"],
    self_care: ["记录每日体重变化", "保持均衡饮食", "规律运动", "减少精神压力"],
    when_to_worry: "6个月内不明原因体重下降超过5%、或体重急剧增加伴水肿和呼吸困难时，应及时就医。",
    default_min_level: "中度",
    source: "参考：《内科学》第9版不明原因体重下降鉴别诊断",
  },
  {
    name: "夜间盗汗",
    aliases: ["夜间盗汗", "盗汗", "睡觉出汗", "夜汗", "夜里出汗", "冒虚汗", "入睡后出汗"],
    danger_signs: ["盗汗伴持续发热", "盗汗伴体重明显下降", "盗汗伴淋巴结肿大", "盗汗伴咳嗽咳血"],
    departments: ["内科", "血液科", "感染科"],
    self_care: ["保持卧室凉爽通风", "穿透气睡衣", "避免睡前进食过饱", "定期监测体温"],
    when_to_worry: "夜间盗汗反复发作伴发热、体重下降或淋巴结肿大时（需排除结核、淋巴瘤），应及时就医。",
    default_min_level: "中度",
    source: "参考：中华医学会感染病学分会《肺结核诊断和治疗指南》",
  },
  {
    name: "发现肿块",
    aliases: ["发现肿块", "肿块", "包块", "淋巴结肿大", "肿物", "硬块", "乳房肿块", "颈部肿块", "腹股沟肿块"],
    danger_signs: ["肿块短期内迅速增大", "质地坚硬不活动", "伴不明原因体重下降", "伴发热盗汗"],
    departments: ["普通外科", "肿瘤科", "乳腺外科"],
    self_care: ["不要反复挤压触摸肿块", "记录肿块大小变化", "尽早就医明确性质"],
    when_to_worry: "肿块持续增大、质硬固定不可推动、伴皮肤表面改变或全身症状时，须尽早就医活检排查。",
    default_min_level: "中度",
    source: "参考：NCCN《软组织肿物临床实践指南》",
  },
  {
    name: "视力模糊",
    aliases: ["视力模糊", "看不清", "视力下降", "眼前模糊", "视物不清", "视力减退", "老花", "飞蚊症"],
    danger_signs: ["突然单眼视力丧失", "视野缺损", "眼前闪光伴大量飞蚊", "伴眼痛头痛"],
    departments: ["眼科", "神经内科", "急诊科"],
    self_care: ["减少长时间用眼", "注意用眼距离和光线", "定期检查视力", "控制血糖血压"],
    when_to_worry: "突发视力丧失或视野缺损、眼前大量闪光和黑影飘动（视网膜脱离）、伴剧烈眼痛时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会眼科学分会《视网膜脱离诊疗规范》",
  },
  {
    name: "听力下降",
    aliases: ["听力下降", "耳聋", "听不清", "听力减退", "耳背", "单侧听力下降", "突然听不见"],
    danger_signs: ["突发单侧听力丧失", "听力下降伴耳道流血", "伴剧烈眩晕呕吐", "伴面瘫"],
    departments: ["耳鼻喉科", "神经内科"],
    self_care: ["避免噪音环境", "不要掏耳朵", "减少使用耳机时间和音量", "定期听力检查"],
    when_to_worry: "突发听力下降（72小时内为黄金治疗期）、伴耳道出血或剧烈眩晕面瘫时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会耳鼻咽喉头颈外科学分会《突发性聋诊断和治疗指南》",
  },
  {
    name: "口腔溃疡",
    aliases: ["口腔溃疡", "口腔溃烂", "嘴里长疮", "口疮", "舌头溃疡", "嘴巴溃疡", "复发性口腔溃疡"],
    danger_signs: ["溃疡超过3周不愈合", "溃疡面积持续增大", "溃疡伴全身皮疹关节痛", "单发硬结性溃疡"],
    departments: ["口腔科", "口腔黏膜科", "风湿免疫科"],
    self_care: ["避免辛辣刺激食物", "使用口腔溃疡贴膜或凝胶", "保持口腔清洁", "补充维生素B和C"],
    when_to_worry: "口腔溃疡超过3周不愈合、溃疡面持续增大或硬结样（需排除口腔癌）、伴全身症状时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：中华口腔医学会《复发性口腔溃疡诊疗指南》",
  },
  {
    name: "鼻血",
    aliases: ["鼻血", "流鼻血", "鼻出血", "鼻衄", "鼻子出血", "止不住鼻血"],
    danger_signs: ["鼻出血量大止不住", "双侧鼻出血", "反复鼻出血伴皮肤瘀斑", "鼻出血伴血压极高"],
    departments: ["耳鼻喉科", "急诊科", "血液科"],
    self_care: ["身体前倾低头", "捏紧鼻翼两侧10-15分钟", "冷敷鼻根部", "避免用力擤鼻"],
    when_to_worry: "鼻出血持续20分钟压迫止血仍无效、出血量大、反复发作伴皮肤瘀斑时，须立即就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会耳鼻咽喉头颈外科学分会《鼻出血诊疗指南》",
  },
  {
    name: "皮肤黄染",
    aliases: ["皮肤黄染", "黄疸", "眼白发黄", "皮肤发黄", "身体发黄", "巩膜黄染", "小便发黄", "茶色尿"],
    danger_signs: ["黄疸迅速加深", "伴腹痛发热（胆管炎三联征）", "伴大便陶土色", "新生儿黄疸迅速升高"],
    departments: ["消化内科", "肝胆外科", "感染科"],
    self_care: ["避免饮酒", "清淡饮食减轻肝脏负担", "充分休息", "注意大便颜色变化"],
    when_to_worry: "黄疸进行性加深、伴腹痛发热寒战（急性胆管炎）、或大便颜色变白时，须立即就医。",
    default_min_level: "中度",
    source: "参考：中华医学会肝病学分会《黄疸诊断与鉴别诊断专家共识》",
  },
  {
    name: "心跳异常",
    aliases: ["心跳异常", "心律不齐", "心跳过快", "心跳过慢", "早搏", "房颤", "心跳不规则", "心动过速", "心动过缓"],
    danger_signs: ["心跳异常伴晕厥", "心率持续<50次/分或>150次/分", "伴胸痛呼吸困难", "伴意识模糊"],
    departments: ["心内科", "急诊科"],
    self_care: ["避免剧烈运动", "减少咖啡因和酒精摄入", "保持情绪稳定", "学会自测脉搏"],
    when_to_worry: "心跳异常伴晕厥、胸痛、呼吸困难、或心率极快极慢时，须立即拨打急救电话。",
    default_min_level: "中度",
    source: "参考：ESC《心律失常管理指南》",
  },
  {
    name: "便秘",
    aliases: ["便秘", "排便困难", "大便干燥", "大便硬", "几天没排便", "肠道不通", "腹胀便秘"],
    danger_signs: ["便秘伴剧烈腹痛腹胀（肠梗阻）", "便秘伴便血", "突发性便秘伴呕吐", "交替出现便秘与腹泻"],
    departments: ["消化内科", "普通外科", "肛肠科"],
    self_care: ["增加膳食纤维摄入", "多饮水", "规律运动", "养成定时排便习惯"],
    when_to_worry: "便秘伴剧烈腹胀腹痛呕吐（肠梗阻征兆）、便血、或排便习惯突然改变时，应及时就医。",
    default_min_level: "轻度",
    source: "参考：中华医学会消化病学分会《中国慢性便秘诊治指南》",
  },
  {
    name: "失眠",
    aliases: ["失眠", "睡不着", "入睡困难", "多梦", "早醒", "睡眠质量差", "整夜睡不着", "浅眠"],
    danger_signs: ["失眠伴严重焦虑抑郁", "连续多日完全无法入睡", "失眠伴幻觉", "失眠伴自伤念头"],
    departments: ["精神科", "神经内科", "心理科"],
    self_care: ["固定作息时间", "睡前避免电子屏幕", "避免咖啡因和酒精", "营造安静黑暗的睡眠环境"],
    when_to_worry: "失眠持续超过1个月严重影响生活、伴严重情绪问题或自伤念头时，应及时寻求专业帮助。",
    default_min_level: "轻度",
    source: "参考：中华医学会神经病学分会《中国成人失眠诊断与治疗指南》",
  },
  {
    name: "便血",
    aliases: ["便血", "大便带血", "血便", "黑便", "柏油便", "肛门出血", "鲜血便", "暗红色血便"],
    danger_signs: ["大量鲜红色便血", "黑便伴头晕乏力（上消化道出血）", "便血伴腹痛发热", "反复便血伴体重下降"],
    departments: ["消化内科", "肛肠科", "急诊科"],
    self_care: ["禁食观察", "卧床休息", "记录出血量和颜色", "禁止使用阿司匹林等抗凝药"],
    when_to_worry: "大量便血伴头晕心慌（失血性休克征兆）、黑便持续、便血伴腹痛高热时，须立即就医。",
    default_min_level: "重度",
    source: "参考：中华医学会消化病学分会《下消化道出血诊治指南》",
  },
];

function toRiskLevel(value: RawSymptomInfo['default_min_level']): RiskLevel {
  switch (value) {
    case '重度':
      return 'orange';
    case '中度':
      return 'yellow';
    default:
      return 'green';
  }
}

function toSymptomId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export const symptomKB: SymptomInfo[] = rawSymptomKB.map((item) => ({
  ...item,
  id: toSymptomId(item.name),
  default_min_level: toRiskLevel(item.default_min_level),
}));

export function searchSymptomKB(userInput: string): SymptomInfo[] {
  if (!userInput || userInput.trim() === "") {
    return [];
  }

  const input = userInput.trim().toLowerCase();
  const keywords = input.split(/\s+/);

  const results: Array<{ info: SymptomInfo; score: number }> = [];

  for (const info of symptomKB) {
    let score = 0;

    for (const alias of info.aliases) {
      const aliasLower = alias.toLowerCase();

      if (aliasLower === input) {
        score = Math.max(score, 100);
        break;
      }

      if (aliasLower.includes(input) || input.includes(aliasLower)) {
        score = Math.max(score, 80);
      }

      for (const keyword of keywords) {
        if (keyword.length >= 1 && aliasLower.includes(keyword)) {
          score = Math.max(score, 60);
        }
      }
    }

    if (score > 0) {
      results.push({ info, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.map((r) => r.info);
}
