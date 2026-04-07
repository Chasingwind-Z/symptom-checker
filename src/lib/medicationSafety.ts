export interface DrugInteraction {
  drug1: string[]
  drug2: string[]
  severity: 'high' | 'medium' | 'low'
  warning: string
}

export interface SafetyCheckResult {
  interaction: DrugInteraction
  triggeredBy: { current: string; recommended: string }
  recommendation: string
}

const DRUG_INTERACTIONS: DrugInteraction[] = [
  // HIGH RISK
  {
    drug1: ['布洛芬', 'ibuprofen', '芬必得'],
    drug2: ['阿司匹林', 'aspirin', '拜阿司匹灵'],
    severity: 'high',
    warning: '两种药物均为NSAIDs类止痛退烧药，同时使用会增加胃出血风险，建议选择其中一种',
  },
  {
    drug1: ['布洛芬', '阿司匹林', '双氯芬酸', 'NSAIDs'],
    drug2: ['华法林', '利伐沙班', '达比加群', '抗凝药'],
    severity: 'high',
    warning: '与抗凝血药物合用可能显著增加出血风险，请务必咨询医生',
  },
  {
    drug1: ['头孢', '头孢克洛', '头孢呋辛', '头孢曲松', '甲硝唑'],
    drug2: ['酒精', '含酒精饮料', '藿香正气水'],
    severity: 'high',
    warning: '头孢类抗生素与酒精可能引发双硫仑反应，严重时可能致命，用药期间及停药7天内禁酒',
  },
  {
    drug1: ['降压药', 'ACEI', '依那普利', '卡托普利', '贝那普利'],
    drug2: ['补钾药', '氯化钾', '枸橼酸钾'],
    severity: 'high',
    warning: 'ACEI类降压药可升高血钾，与补钾药合用有高钾血症风险',
  },
  {
    drug1: ['地高辛'],
    drug2: ['胺碘酮'],
    severity: 'high',
    warning: '胺碘酮可升高地高辛血药浓度，增加地高辛中毒风险',
  },
  {
    drug1: ['甲氨蝶呤'],
    drug2: ['布洛芬', '阿司匹林', 'NSAIDs'],
    severity: 'high',
    warning: 'NSAIDs会减少甲氨蝶呤排泄，增加其毒性',
  },
  {
    drug1: ['锂盐', '碳酸锂'],
    drug2: ['布洛芬', '双氯芬酸', 'NSAIDs'],
    severity: 'high',
    warning: 'NSAIDs可升高锂盐血药浓度，增加锂中毒风险',
  },
  {
    drug1: ['MAO抑制剂', '吗氯贝胺', '司来吉兰'],
    drug2: ['伪麻黄碱', '含伪麻黄碱感冒药', '新康泰克'],
    severity: 'high',
    warning: '可能引发高血压危象，绝对禁止合用',
  },
  // MEDIUM RISK
  {
    drug1: ['降压药', '氨氯地平', '缬沙坦', '厄贝沙坦'],
    drug2: ['布洛芬', 'NSAIDs', '双氯芬酸'],
    severity: 'medium',
    warning: 'NSAIDs可能减弱降压药效果，合用期间请监测血压',
  },
  {
    drug1: ['二甲双胍'],
    drug2: ['酒精', '含酒精饮料'],
    severity: 'medium',
    warning: '二甲双胍与酒精合用增加乳酸酸中毒风险',
  },
  {
    drug1: ['他汀', '阿托伐他汀', '辛伐他汀', '瑞舒伐他汀'],
    drug2: ['葡萄柚', '西柚汁'],
    severity: 'medium',
    warning: '葡萄柚可升高他汀类血药浓度，增加肌肉损伤风险',
  },
  {
    drug1: ['氯吡格雷', '波立维'],
    drug2: ['奥美拉唑', '埃索美拉唑'],
    severity: 'medium',
    warning: '奥美拉唑可能减弱氯吡格雷的抗血小板效果，建议换用泮托拉唑',
  },
  {
    drug1: ['华法林', '抗凝药'],
    drug2: ['维生素K', '大量绿叶蔬菜'],
    severity: 'medium',
    warning: '大量维生素K可能影响抗凝效果的稳定性，饮食应保持一致',
  },
  {
    drug1: ['舍曲林', '氟西汀', 'SSRIs'],
    drug2: ['曲马多'],
    severity: 'medium',
    warning: '合用可能引发5-羟色胺综合征，表现为烦躁、肌肉抽搐、高热',
  },
  {
    drug1: ['地高辛'],
    drug2: ['钙片', '碳酸钙', '葡萄糖酸钙'],
    severity: 'medium',
    warning: '血钙升高可增加地高辛的心脏毒性，需监测',
  },
  {
    drug1: ['环孢素'],
    drug2: ['他汀', '阿托伐他汀', '辛伐他汀'],
    severity: 'medium',
    warning: '合用增加横纹肌溶解风险，需密切监测肌酶',
  },
  // LOW RISK
  {
    drug1: ['布洛芬', 'NSAIDs'],
    drug2: ['咖啡', '浓茶'],
    severity: 'low',
    warning: '咖啡因可能加重NSAIDs对胃部的刺激，建议饭后服药',
  },
  {
    drug1: ['钙片', '碳酸钙'],
    drug2: ['铁剂', '硫酸亚铁', '琥珀酸亚铁'],
    severity: 'low',
    warning: '钙和铁会互相影响吸收，建议间隔2小时以上服用',
  },
  {
    drug1: ['抗生素', '阿莫西林', '头孢'],
    drug2: ['益生菌', '双歧杆菌'],
    severity: 'low',
    warning: '抗生素可能杀死益生菌，建议间隔2小时服用',
  },
  {
    drug1: ['降压药'],
    drug2: ['甘草', '甘草片', '复方甘草片'],
    severity: 'low',
    warning: '甘草可能升高血压，长期大量使用可能影响降压效果',
  },
  {
    drug1: ['对乙酰氨基酚', '扑热息痛', '泰诺'],
    drug2: ['对乙酰氨基酚', '扑热息痛', '感冒灵', '白加黑', '日夜百服宁'],
    severity: 'high',
    warning: '多种感冒药可能都含对乙酰氨基酚，重复服用有肝损伤风险，每日总量不超过2g',
  },
  {
    drug1: ['安眠药', '佐匹克隆', '唑吡坦'],
    drug2: ['抗过敏药', '氯雷他定', '西替利嗪', '扑尔敏'],
    severity: 'low',
    warning: '两类药物都可能引起嗜睡，合用时嗜睡作用加重，避免驾车',
  },
  // ── 感冒药重复成分警告 ──
  {
    drug1: ['泰诺', '对乙酰氨基酚', '扑热息痛'],
    drug2: ['感冒灵颗粒', '感冒灵'],
    severity: 'high',
    warning: '泰诺与感冒灵均含对乙酰氨基酚，重复服用可致肝损伤，每日总量不超过2g',
  },
  {
    drug1: ['白加黑', '日片', '夜片'],
    drug2: ['泰诺', '对乙酰氨基酚'],
    severity: 'high',
    warning: '白加黑含对乙酰氨基酚，与泰诺同服会导致对乙酰氨基酚过量，有肝损伤风险',
  },
  {
    drug1: ['新康泰克', '伪麻黄碱'],
    drug2: ['白加黑', '日夜百服宁', '感冒药'],
    severity: 'medium',
    warning: '多种感冒药可能含相同减充血剂成分，重复使用可能导致血压升高和心跳加快',
  },
  {
    drug1: ['连花清瘟', '板蓝根'],
    drug2: ['对乙酰氨基酚', '布洛芬', '泰诺'],
    severity: 'low',
    warning: '部分中成药感冒药已含退热成分，与西药退烧药合用时注意避免重复退热',
  },
  // ── 抗生素+食物/饮品 ──
  {
    drug1: ['四环素', '多西环素', '米诺环素'],
    drug2: ['牛奶', '乳制品', '钙片', '铝镁抗酸药'],
    severity: 'medium',
    warning: '四环素类与钙离子结合形成不可吸收的螯合物，应间隔2小时以上服用',
  },
  {
    drug1: ['喹诺酮', '左氧氟沙星', '莫西沙星', '环丙沙星'],
    drug2: ['牛奶', '钙片', '铝镁抗酸药', '铁剂'],
    severity: 'medium',
    warning: '喹诺酮类抗生素与含金属离子的食物或药物同服会降低吸收率，应间隔2小时',
  },
  {
    drug1: ['利奈唑胺'],
    drug2: ['腐乳', '豆腐乳', '红酒', '腊肉', '酱油', '富含酪胺食物'],
    severity: 'high',
    warning: '利奈唑胺具有弱MAO抑制作用，与富含酪胺食物同食可能引发高血压危象',
  },
  {
    drug1: ['阿莫西林克拉维酸钾', '阿莫西林'],
    drug2: ['甲氨蝶呤'],
    severity: 'high',
    warning: '阿莫西林可减少甲氨蝶呤肾排泄，增加甲氨蝶呤毒性',
  },
  // ── 老年人常见药+OTC ──
  {
    drug1: ['华法林', '抗凝药'],
    drug2: ['阿司匹林', '拜阿司匹灵'],
    severity: 'high',
    warning: '华法林与阿司匹林同用显著增加出血风险，需严格遵医嘱监测INR',
  },
  {
    drug1: ['降压药', 'ACEI', 'ARB', '缬沙坦', '厄贝沙坦'],
    drug2: ['布洛芬', '双氯芬酸', 'NSAIDs', '芬必得'],
    severity: 'high',
    warning: '老年人长期服用降压药期间使用NSAIDs可能导致肾功能恶化和血压控制不佳',
  },
  {
    drug1: ['地高辛'],
    drug2: ['螺内酯', '安体舒通'],
    severity: 'medium',
    warning: '螺内酯可升高血钾并影响地高辛排泄，需监测血钾和地高辛浓度',
  },
  {
    drug1: ['华法林'],
    drug2: ['丹参', '丹参片', '复方丹参滴丸'],
    severity: 'medium',
    warning: '丹参具有活血化瘀作用，可增强华法林抗凝效果，增加出血风险',
  },
  {
    drug1: ['他汀', '阿托伐他汀', '辛伐他汀'],
    drug2: ['红曲', '红曲米', '血脂康'],
    severity: 'medium',
    warning: '红曲含天然洛伐他汀，与他汀类药物合用相当于增加剂量，增加肌病风险',
  },
  // ── 糖尿病药物相互作用 ──
  {
    drug1: ['二甲双胍'],
    drug2: ['碘造影剂', 'CT增强造影'],
    severity: 'high',
    warning: '碘造影剂可能诱发二甲双胍相关乳酸酸中毒，检查前后需停用二甲双胍48小时',
  },
  {
    drug1: ['胰岛素', '诺和灵', '诺和锐', '甘精胰岛素'],
    drug2: ['美托洛尔', '比索洛尔', 'β受体阻滞剂', 'beta-blocker'],
    severity: 'medium',
    warning: 'β受体阻滞剂可掩盖低血糖症状（如心悸、手抖），合用需加强血糖监测',
  },
  {
    drug1: ['格列本脲', '格列美脲', '磺脲类'],
    drug2: ['氟康唑', '酮康唑'],
    severity: 'high',
    warning: '唑类抗真菌药可抑制磺脲类代谢，显著增加低血糖风险',
  },
  {
    drug1: ['二甲双胍'],
    drug2: ['大量饮酒', '酒精', '白酒'],
    severity: 'high',
    warning: '酒精抑制肝脏糖异生，与二甲双胍合用显著增加乳酸酸中毒和严重低血糖风险',
  },
]

function normalizeInput(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

function matchesDrug(input: string, drugNames: string[]): boolean {
  const normalized = normalizeInput(input)
  return drugNames.some((name) => {
    const normalizedName = normalizeInput(name)
    return normalized.includes(normalizedName) || normalizedName.includes(normalized)
  })
}

export function checkMedicationSafety(
  currentMedications: string[],
  recommendedDrugs: string[]
): SafetyCheckResult[] {
  const results: SafetyCheckResult[] = []

  for (const current of currentMedications) {
    for (const recommended of recommendedDrugs) {
      for (const interaction of DRUG_INTERACTIONS) {
        const match1 =
          (matchesDrug(current, interaction.drug1) && matchesDrug(recommended, interaction.drug2)) ||
          (matchesDrug(current, interaction.drug2) && matchesDrug(recommended, interaction.drug1))

        if (match1) {
          // Avoid duplicates
          const exists = results.some(
            (r) =>
              r.triggeredBy.current === current &&
              r.triggeredBy.recommended === recommended &&
              r.interaction === interaction
          )
          if (!exists) {
            results.push({
              interaction,
              triggeredBy: { current, recommended },
              recommendation:
                interaction.severity === 'high'
                  ? '建议先咨询医生或药师再决定是否使用'
                  : interaction.severity === 'medium'
                    ? '使用前建议确认，或告知药师您的现有用药'
                    : '注意观察，如有不适及时停药',
            })
          }
        }
      }
    }
  }

  // Sort by severity: high first
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  results.sort((a, b) => severityOrder[a.interaction.severity] - severityOrder[b.interaction.severity])

  return results
}

export function formatSafetyWarningsForAI(results: SafetyCheckResult[]): string {
  if (results.length === 0) return ''
  const lines = results.map(
    (r) =>
      `⚠️ ${r.triggeredBy.current} + ${r.triggeredBy.recommended}（${
        r.interaction.severity === 'high' ? '高风险' : r.interaction.severity === 'medium' ? '中风险' : '注意'
      }）：${r.interaction.warning}`
  )
  return `【用药安全提醒】\n${lines.join('\n')}`
}
