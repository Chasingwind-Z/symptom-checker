export interface SymptomInfo {
  name: string;
  aliases: string[];
  danger_signs: string[];
  departments: string[];
  self_care: string[];
  when_to_worry: string;
  default_min_level: "轻度" | "中度" | "重度";
}

export const symptomKB: SymptomInfo[] = [
  {
    name: "发烧",
    aliases: ["发烧", "发热", "高烧", "低烧", "体温升高", "退烧", "烧退"],
    danger_signs: ["体温超过39.5°C", "高热惊厥", "伴意识障碍", "热程超过3天无好转"],
    departments: ["内科", "急诊科", "感染科"],
    self_care: ["多喝水", "物理降温（温水擦浴）", "适当休息", "体温38.5°C以上可服用退烧药"],
    when_to_worry: "体温持续超过39°C超过24小时，或伴随剧烈头痛、皮疹、意识障碍时，应立即就医。",
    default_min_level: "中度",
  },
  {
    name: "咳嗽",
    aliases: ["咳嗽", "干咳", "咳痰", "痰多", "咳血", "剧烈咳嗽", "久咳", "慢性咳嗽"],
    danger_signs: ["咳血", "呼吸困难", "持续咳嗽超过3周", "咳嗽伴高热"],
    departments: ["呼吸科", "内科", "耳鼻喉科"],
    self_care: ["保持室内湿润", "多喝温水", "避免刺激性气体", "蜂蜜水缓解干咳"],
    when_to_worry: "咳嗽持续超过3周、痰中带血、伴随呼吸困难或体重明显下降时，应及时就医。",
    default_min_level: "轻度",
  },
  {
    name: "头痛",
    aliases: ["头痛", "头疼", "偏头痛", "头胀", "头部疼痛", "头顶痛", "后脑痛", "太阳穴痛"],
    danger_signs: ["突发剧烈头痛（雷击样）", "伴发热颈强直", "视力改变", "意识障碍", "头痛伴呕吐"],
    departments: ["神经内科", "内科", "急诊科"],
    self_care: ["休息避光", "冷热敷", "保持充足睡眠", "适当按摩太阳穴"],
    when_to_worry: "突发剧烈头痛、头痛伴发热和颈部僵硬、伴随肢体无力或语言障碍时，需立即就医。",
    default_min_level: "中度",
  },
  {
    name: "胸痛",
    aliases: ["胸痛", "胸闷", "胸部疼痛", "心口痛", "前胸痛", "胸部压迫感", "胸口痛"],
    danger_signs: ["胸痛伴左臂放射痛", "大汗淋漓", "呼吸困难", "持续超过15分钟", "胸痛伴晕厥"],
    departments: ["心内科", "急诊科", "胸外科"],
    self_care: ["立即休息，避免活动", "松开衣领", "如有硝酸甘油可含服"],
    when_to_worry: "任何急性胸痛均应视为紧急情况，尤其伴随出汗、左臂痛、呼吸困难时，应立即拨打急救电话。",
    default_min_level: "重度",
  },
  {
    name: "腹痛",
    aliases: ["腹痛", "肚子痛", "胃痛", "腹部疼痛", "肚痛", "绞痛", "腹绞痛", "胃部不适", "下腹痛", "上腹痛"],
    danger_signs: ["腹痛剧烈且持续", "腹部板状硬", "伴高热", "呕血或便血", "腹痛伴休克症状"],
    departments: ["消化内科", "普通外科", "急诊科"],
    self_care: ["热敷缓解痉挛性疼痛", "禁食静养", "避免使用止痛药以免掩盖症状"],
    when_to_worry: "腹痛持续超过6小时无缓解、痛感剧烈或腹部变硬、伴随发热或呕血时，应立即就医。",
    default_min_level: "中度",
  },
  {
    name: "呼吸困难",
    aliases: ["呼吸困难", "气短", "喘不过气", "憋气", "胸闷气短", "呼吸急促", "气喘", "喘息", "透不过气"],
    danger_signs: ["静息状态下呼吸困难", "嘴唇发紫", "血氧饱和度低于90%", "伴胸痛", "突发严重呼吸困难"],
    departments: ["急诊科", "呼吸科", "心内科"],
    self_care: ["保持半坐位", "保持环境通风", "避免剧烈活动"],
    when_to_worry: "任何突发严重呼吸困难、嘴唇或指甲发紫、静坐时也喘不过气，均需立即拨打急救电话。",
    default_min_level: "重度",
  },
  {
    name: "乏力",
    aliases: ["乏力", "疲劳", "疲乏", "无力", "倦怠", "虚弱", "精神差", "没精神", "浑身没劲"],
    danger_signs: ["极度乏力无法活动", "伴随黄疸", "体重明显下降", "乏力持续超过2周"],
    departments: ["内科", "血液科", "内分泌科"],
    self_care: ["保证充足睡眠", "均衡饮食", "适量运动", "减少压力"],
    when_to_worry: "乏力持续2周以上无改善、伴随不明原因体重下降、皮肤发黄或呼吸困难时，应及时就医。",
    default_min_level: "轻度",
  },
  {
    name: "头晕",
    aliases: ["头晕", "眩晕", "晕眩", "天旋地转", "头昏", "站不稳", "头重脚轻", "晕", "平衡障碍"],
    danger_signs: ["突发剧烈眩晕伴呕吐", "头晕伴肢体无力", "头晕伴言语不清", "反复发作"],
    departments: ["神经内科", "耳鼻喉科", "内科"],
    self_care: ["立即坐下或躺下", "避免突然起身", "闭眼休息", "补充水分"],
    when_to_worry: "头晕伴随单侧肢体无力、言语困难、视力模糊或面部麻木时，可能是脑卒中先兆，须立即就医。",
    default_min_level: "中度",
  },
  {
    name: "恶心呕吐",
    aliases: ["恶心", "呕吐", "恶心呕吐", "想吐", "干呕", "呕逆", "反胃", "恶心感", "吐", "作呕"],
    danger_signs: ["呕血", "严重脱水征象", "剧烈腹痛伴呕吐", "头痛剧烈伴呕吐", "持续24小时以上"],
    departments: ["消化内科", "急诊科", "内科"],
    self_care: ["少量多次饮水防脱水", "暂时禁食", "清淡饮食", "生姜茶缓解恶心"],
    when_to_worry: "呕吐物含血、呕吐持续超过24小时、伴随剧烈腹痛或头痛、无法补充水分时，应及时就医。",
    default_min_level: "中度",
  },
  {
    name: "腹泻",
    aliases: ["腹泻", "拉肚子", "水样便", "稀便", "频繁排便", "肠胃不适", "急性腹泻", "慢性腹泻"],
    danger_signs: ["血便", "脓血便", "严重脱水（口干极渴、尿少）", "高热伴腹泻", "持续超过3天"],
    departments: ["消化内科", "感染科", "内科"],
    self_care: ["补充口服补液盐", "清淡饮食（米粥、面条）", "避免乳制品和油腻食物"],
    when_to_worry: "腹泻超过3天、大便带血或脓、伴随高热或严重脱水症状时，应及时就医。",
    default_min_level: "中度",
  },
  {
    name: "皮疹",
    aliases: ["皮疹", "皮肤疹子", "红疹", "皮肤红点", "荨麻疹", "皮炎", "过敏疹", "斑疹", "丘疹", "皮肤起疹"],
    danger_signs: ["皮疹伴呼吸困难（过敏反应）", "皮疹迅速扩散全身", "出血性皮疹（紫癜）", "皮疹伴高热"],
    departments: ["皮肤科", "变态反应科", "急诊科"],
    self_care: ["避免搔抓", "穿宽松透气衣物", "远离已知过敏原", "冷水敷可缓解瘙痒"],
    when_to_worry: "皮疹伴随呼吸困难或喉咙肿胀（过敏休克先兆）、皮疹为出血点或瘀斑、伴随高热不退时，须立即就医。",
    default_min_level: "轻度",
  },
  {
    name: "关节痛",
    aliases: ["关节痛", "关节疼痛", "关节肿痛", "膝盖痛", "手指痛", "关节炎", "骨关节痛", "关节僵硬", "关节红肿"],
    danger_signs: ["关节突然红肿热痛伴发热", "外伤后关节变形", "关节痛影响日常活动"],
    departments: ["骨科", "风湿科", "内科"],
    self_care: ["适当休息关节", "冷热交替敷", "适度低强度运动维持活动度", "减轻体重减少关节负担"],
    when_to_worry: "关节突发剧烈红肿热痛伴发热（可能是化脓性关节炎）、外伤后关节畸形时，应立即就医。",
    default_min_level: "中度",
  },
  {
    name: "眼部不适",
    aliases: ["眼部不适", "眼痛", "眼红", "视力模糊", "眼睛充血", "结膜炎", "眼睛痒", "流泪", "眼分泌物多", "眼花", "眼涩"],
    danger_signs: ["突然视力丧失", "眼外伤", "眼内异物", "持续眼痛伴头痛恶心（急性青光眼）"],
    departments: ["眼科", "急诊科"],
    self_care: ["避免揉眼", "避免强光刺激", "使用人工泪液缓解干涩", "注意用眼卫生"],
    when_to_worry: "突然单眼或双眼视力下降、眼痛剧烈伴头痛呕吐、眼部受伤时，需立即就医。",
    default_min_level: "中度",
  },
  {
    name: "耳鸣",
    aliases: ["耳鸣", "耳朵嗡嗡响", "耳鸣耳聋", "听力下降", "耳痛", "耳朵响", "耳道不适", "耳聋"],
    danger_signs: ["突发单侧耳聋", "耳鸣伴剧烈眩晕", "耳道流脓或出血", "耳鸣伴头痛"],
    departments: ["耳鼻喉科", "神经内科"],
    self_care: ["避免噪音环境", "减少咖啡因摄入", "保证充足睡眠", "减轻精神压力"],
    when_to_worry: "突然出现单侧耳鸣或听力骤降（突发性耳聋）、耳道流脓或出血时，应立即就医（突发性耳聋须48小时内治疗）。",
    default_min_level: "轻度",
  },
  {
    name: "心悸",
    aliases: ["心悸", "心慌", "心跳加速", "心跳不规律", "胸闷心跳", "心跳过快", "心律不齐", "心跳漏跳", "心慌意乱"],
    danger_signs: ["心悸伴胸痛", "心悸伴晕厥", "心悸伴严重呼吸困难", "心率持续超过150次/分"],
    departments: ["心内科", "急诊科"],
    self_care: ["深呼吸放松", "避免咖啡因和烟酒", "保证充足睡眠", "尝试迷走神经刺激（屏气用力）"],
    when_to_worry: "心悸伴随胸痛、晕厥或接近晕厥、持续性心跳异常快（超过150次/分）时，须立即就医。",
    default_min_level: "中度",
  },
  {
    name: "背痛",
    aliases: ["背痛", "腰痛", "背部疼痛", "腰背痛", "脊背痛", "肩背痛", "腰酸背痛", "下腰痛", "腰肌劳损"],
    danger_signs: ["背痛伴大小便失控", "外伤后背痛", "持续性夜间背痛", "背痛伴腿部麻木无力"],
    departments: ["骨科", "脊柱外科", "疼痛科"],
    self_care: ["热敷放松肌肉", "适当卧床休息", "避免长时间弯腰", "核心肌群锻炼"],
    when_to_worry: "背痛伴随下肢麻木无力、大小便功能障碍（马尾综合征）、外伤后背痛时，须立即就医。",
    default_min_level: "轻度",
  },
  {
    name: "喉咙痛",
    aliases: ["喉咙痛", "咽喉痛", "嗓子痛", "咽痛", "吞咽痛", "喉咙不适", "咽喉炎", "扁桃体痛", "咽干"],
    danger_signs: ["喉咙痛伴呼吸困难", "无法吞咽唾液", "喉咙痛伴高热超过39°C", "颈部肿胀明显"],
    departments: ["耳鼻喉科", "内科", "急诊科"],
    self_care: ["盐水漱口", "多喝温水", "含服润喉糖", "蜂蜜水缓解"],
    when_to_worry: "喉咙痛导致无法吞咽、伴呼吸困难或口水外流、颈部严重肿胀（可能是会厌炎）时，须立即就医。",
    default_min_level: "轻度",
  },
  {
    name: "鼻塞",
    aliases: ["鼻塞", "鼻子不通", "鼻涕", "流鼻涕", "鼻塞流涕", "鼻窦炎", "过敏性鼻炎", "鼻腔堵塞", "鼻子堵"],
    danger_signs: ["鼻塞伴高热头痛超过1周", "鼻涕带血", "单侧持续性鼻塞伴嗅觉丧失"],
    departments: ["耳鼻喉科", "变态反应科"],
    self_care: ["生理盐水鼻腔冲洗", "蒸汽吸入", "抬高枕头睡眠", "避免接触过敏原"],
    when_to_worry: "鼻塞持续超过2周无改善、单侧鼻塞伴鼻涕带血或嗅觉消失、伴严重头痛时，应及时就医。",
    default_min_level: "轻度",
  },
  {
    name: "水肿",
    aliases: ["水肿", "浮肿", "下肢肿", "脚肿", "腿肿", "眼睑浮肿", "全身水肿", "局部肿胀", "肿胀"],
    danger_signs: ["突发单侧下肢肿胀伴疼痛（可能血栓）", "全身性水肿伴呼吸困难", "眼睑及颜面水肿伴尿少"],
    departments: ["心内科", "肾内科", "血管外科"],
    self_care: ["抬高下肢", "减少盐分摄入", "适度活动促进血液循环", "穿弹力袜"],
    when_to_worry: "单侧下肢突然肿胀红痛（深静脉血栓）、水肿伴呼吸困难、全身水肿伴尿量明显减少时，须立即就医。",
    default_min_level: "中度",
  },
  {
    name: "意识改变",
    aliases: ["意识改变", "意识障碍", "昏迷", "意识不清", "神志不清", "谵妄", "嗜睡", "反应迟钝", "叫不醒", "昏厥", "晕倒"],
    danger_signs: ["无法唤醒", "肢体抽搐", "呼吸异常", "伴随颈部僵硬发热", "头部外伤后意识改变"],
    departments: ["急诊科", "神经内科", "ICU"],
    self_care: ["立即拨打急救电话120", "保持气道通畅", "侧卧防误吸", "不要给意识不清者喂食"],
    when_to_worry: "任何程度的意识障碍均属急症，应立即拨打120急救电话，同时保持患者气道通畅并等待急救人员。",
    default_min_level: "重度",
  },
];

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
