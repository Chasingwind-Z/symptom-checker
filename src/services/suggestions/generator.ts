import type { Population } from '../../types';

export interface Suggestion {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  query: string;
  tags: string[];
  weight: number;
}

const SUGGESTION_POOL: Suggestion[] = [
  // self — decision voice, first person
  { id: 's-headache-work', icon: 'Brain', title: '头痛三天，今天上不上班', subtitle: '判断能不能扛', query: '我头痛三天了，今天还能上班吗？需要去医院吗？', tags: ['self', 'headache'], weight: 1.0 },
  { id: 's-cold-change', icon: 'Thermometer', title: '感冒一周没好，要不要换药', subtitle: '继续吃 vs 去看医生', query: '我感冒一周了还没好，是继续吃药还是该去医院？', tags: ['self', 'cold', 'flu'], weight: 1.0 },
  { id: 's-stomach-check', icon: 'Stethoscope', title: '胃痛反复了，要不要做胃镜', subtitle: '扛一扛 vs 查一下', query: '我胃痛反复发作好几次了，要不要去做个胃镜？', tags: ['self', 'stomach'], weight: 1.0 },
  { id: 's-sleep-adjust', icon: 'Moon', title: '睡眠差两周，先调整还是去医院', subtitle: '自己调 vs 看医生', query: '我失眠两周了，是先自己调整还是该去看医生？', tags: ['self', 'night', 'insomnia'], weight: 1.0 },
  { id: 's-back-work', icon: 'Activity', title: '腰背酸两天，是工伤还是自愈', subtitle: '休息就好 vs 要拍片', query: '腰背酸了两天，是肌肉问题自己会好还是要去查？', tags: ['self', 'pain'], weight: 1.0 },
  { id: 's-throat-wait', icon: 'Wind', title: '嗓子发炎，扛一扛还是吃药', subtitle: '喝水够不够', query: '嗓子发炎疼得厉害，扛一扛能好还是要吃药？', tags: ['self', 'cold'], weight: 1.0 },
  { id: 's-dizzy-urgent', icon: 'AlertCircle', title: '突然头晕，是不是要紧', subtitle: '等一等 vs 马上去', query: '突然头晕了一下，是不是什么要紧的事？', tags: ['self', 'dizzy'], weight: 1.0 },
  { id: 's-heart-check', icon: 'HeartPulse', title: '心慌一下，要不要查一查', subtitle: '正常 vs 该看心内科', query: '偶尔心慌一下，要不要去查个心电图？', tags: ['self', 'chest'], weight: 1.0 },
  { id: 's-allergy-season', icon: 'Flower2', title: '鼻子眼睛痒，吃药还是扛', subtitle: '过敏季怎么办', query: '鼻子眼睛都痒，是过敏吗？吃药还是先观察？', tags: ['self', 'allergy', 'spring'], weight: 1.0 },
  { id: 's-fatigue-check', icon: 'Activity', title: '最近总没力气，该不该查', subtitle: '太累了 vs 要体检', query: '最近总是没力气，是太累还是身体有问题？', tags: ['self', 'fatigue'], weight: 1.0 },
  { id: 's-diarrhea-eat', icon: 'Droplets', title: '拉肚子一天，吃药还是等', subtitle: '药 vs 补水就行', query: '拉肚子一天好几次，需要吃药还是多喝水就行？', tags: ['self', 'diarrhea', 'heatstroke'], weight: 1.0 },
  { id: 's-skin-itch', icon: 'Sparkles', title: '身上起疹子，过敏还是皮肤病', subtitle: '吃抗过敏药 vs 看皮肤科', query: '身上突然起了疹子很痒，是过敏还是该看皮肤科？', tags: ['self', 'allergy', 'spring'], weight: 1.0 },

  // pediatric (12)
  { id: 'p-fever-night', icon: 'Thermometer', title: '孩子半夜发烧38.5℃', subtitle: '今晚要不要去急诊', query: '孩子半夜发烧38.5度，要去急诊吗', tags: ['pediatric', 'fever', 'night'], weight: 1.0 },
  { id: 'p-cough', icon: 'Wind', title: '宝宝咳嗽半夜加重', subtitle: '判断严重程度', query: '宝宝咳嗽，半夜特别厉害', tags: ['pediatric', 'cough', 'night'], weight: 1.0 },
  { id: 'p-diarrhea', icon: 'Droplets', title: '小孩拉肚子三次了', subtitle: '需要注意什么', query: '小孩今天拉肚子三次了', tags: ['pediatric', 'diarrhea', 'heatstroke'], weight: 1.0 },
  { id: 'p-head-bump', icon: 'AlertCircle', title: '孩子摔到头怎么办', subtitle: '紧急判断指南', query: '孩子摔倒碰到头了，需要去医院吗', tags: ['pediatric', 'injury'], weight: 1.0 },
  { id: 'p-rash', icon: 'Sparkles', title: '孩子身上出疹子', subtitle: '识别常见皮疹', query: '孩子身上突然出了很多红疹子', tags: ['pediatric', 'allergy', 'spring'], weight: 1.0 },
  { id: 'p-fever-day', icon: 'Thermometer', title: '孩子白天低烧37.8℃', subtitle: '要不要吃退烧药', query: '孩子白天低烧37.8度，要吃退烧药吗', tags: ['pediatric', 'fever'], weight: 1.0 },
  { id: 'p-vomit', icon: 'Droplets', title: '孩子吐了两次', subtitle: '要不要去医院', query: '孩子吐了两次，需要去医院吗', tags: ['pediatric', 'vomit'], weight: 1.0 },
  { id: 'p-ear-pain', icon: 'AlertCircle', title: '孩子说耳朵疼', subtitle: '是中耳炎吗', query: '孩子说耳朵疼，是不是中耳炎', tags: ['pediatric'], weight: 1.0 },
  { id: 'p-nosebleed', icon: 'Droplets', title: '孩子流鼻血了', subtitle: '怎么处理', query: '孩子突然流鼻血了，怎么处理', tags: ['pediatric'], weight: 1.0 },
  { id: 'p-belly-night', icon: 'AlertCircle', title: '孩子半夜喊肚子疼', subtitle: '要不要去急诊', query: '孩子半夜喊肚子疼', tags: ['pediatric', 'night'], weight: 1.0 },
  { id: 'p-no-eat', icon: 'Stethoscope', title: '孩子两天不怎么吃东西', subtitle: '要担心吗', query: '孩子两天不太吃东西', tags: ['pediatric'], weight: 1.0 },
  { id: 'p-cough-week', icon: 'Wind', title: '咳嗽一周了还没好', subtitle: '要换药还是查一下', query: '孩子咳嗽一周了还没好', tags: ['pediatric', 'cough'], weight: 1.0 },

  // geriatric (12)
  { id: 'g-chest', icon: 'HeartPulse', title: '老人胸闷气短', subtitle: '评估紧急程度', query: '家里老人说胸闷气短', tags: ['geriatric', 'chest', 'emergency'], weight: 1.0 },
  { id: 'g-speech', icon: 'Brain', title: '突然说话不清楚', subtitle: '可能是中风信号', query: '老人突然说话不太清楚了', tags: ['geriatric', 'stroke', 'emergency'], weight: 1.0 },
  { id: 'g-dizzy-meal', icon: 'Activity', title: '饭后头晕', subtitle: '判断原因', query: '老人每次吃完饭就头晕', tags: ['geriatric', 'dizzy', 'morning'], weight: 1.0 },
  { id: 'g-fall', icon: 'AlertCircle', title: '老人摔了一跤', subtitle: '需要去拍片吗', query: '老人摔了一跤，需要去医院检查吗', tags: ['geriatric', 'injury'], weight: 1.0 },
  { id: 'g-forget', icon: 'Brain', title: '老人最近老忘事', subtitle: '正常还是要检查', query: '老人最近经常忘事，需要担心吗', tags: ['geriatric'], weight: 1.0 },
  { id: 'g-cant-sleep', icon: 'Moon', title: '老人整夜睡不着', subtitle: '怎么帮助改善', query: '老人整夜睡不着觉', tags: ['geriatric', 'night', 'insomnia'], weight: 1.0 },
  { id: 'g-leg-swollen', icon: 'Activity', title: '老人腿肿了', subtitle: '什么原因', query: '老人腿突然肿了', tags: ['geriatric'], weight: 1.0 },
  { id: 'g-no-appetite', icon: 'Stethoscope', title: '老人不想吃东西', subtitle: '需要注意什么', query: '老人这几天不想吃东西', tags: ['geriatric'], weight: 1.0 },
  { id: 'g-cough-long', icon: 'Wind', title: '老人一直咳嗽', subtitle: '是不是该查一下', query: '老人咳嗽持续很久了', tags: ['geriatric', 'cough', 'flu'], weight: 1.0 },
  { id: 'g-bp-morning', icon: 'HeartPulse', title: '早上量血压偏高', subtitle: '要不要调药', query: '老人早上血压偏高', tags: ['geriatric', 'bp', 'morning'], weight: 1.0 },
  { id: 'g-shaky', icon: 'Activity', title: '老人手抖得厉害', subtitle: '要去看神经科吗', query: '老人手抖得越来越厉害', tags: ['geriatric'], weight: 1.0 },
  { id: 'g-chest-night', icon: 'HeartPulse', title: '老人半夜说心慌', subtitle: '紧急程度评估', query: '老人半夜说心慌', tags: ['geriatric', 'chest', 'night', 'emergency'], weight: 1.0 },

  // chronic (12)
  { id: 'c-bp-high', icon: 'HeartPulse', title: '血压突然160怎么办', subtitle: '紧急处理建议', query: '血压突然升到160了怎么办', tags: ['chronic', 'bp', 'emergency'], weight: 1.0 },
  { id: 'c-sugar', icon: 'Droplets', title: '血糖空腹8.2', subtitle: '需要调药吗', query: '空腹血糖8.2，需要调整用药吗', tags: ['chronic', 'sugar', 'morning'], weight: 1.0 },
  { id: 'c-missed-med', icon: 'Pill', title: '降压药漏吃一次', subtitle: '补吃还是跳过', query: '降压药忘记吃了一次，要补吃吗', tags: ['chronic', 'medication'], weight: 1.0 },
  { id: 'c-dizzy-drug', icon: 'Brain', title: '头晕和药有关系吗', subtitle: '药物副作用判断', query: '最近头晕，不知道和吃的药有没有关系', tags: ['chronic', 'dizzy', 'medication'], weight: 1.0 },
  { id: 'c-bp-fluctuate', icon: 'Activity', title: '血压忽高忽低', subtitle: '要换药吗', query: '最近血压忽高忽低不稳定', tags: ['chronic', 'bp'], weight: 1.0 },
  { id: 'c-sugar-low', icon: 'AlertCircle', title: '感觉低血糖了', subtitle: '紧急处理', query: '头晕冒冷汗，感觉低血糖了', tags: ['chronic', 'sugar', 'emergency'], weight: 1.0 },
  { id: 'c-foot-numb', icon: 'Activity', title: '糖尿病脚麻', subtitle: '需要注意什么', query: '有糖尿病，最近脚经常发麻', tags: ['chronic', 'sugar'], weight: 1.0 },
  { id: 'c-drug-side', icon: 'Pill', title: '吃药后胃不舒服', subtitle: '能不能换药', query: '吃降压药后胃不舒服，能换药吗', tags: ['chronic', 'medication'], weight: 1.0 },
  { id: 'c-two-drugs', icon: 'AlertCircle', title: '两种药能一起吃吗', subtitle: '药物冲突检查', query: '想知道这两种药能不能一起吃', tags: ['chronic', 'medication'], weight: 1.0 },
  { id: 'c-bp-morning', icon: 'HeartPulse', title: '早起血压特别高', subtitle: '晨峰高血压处理', query: '每天早起血压特别高', tags: ['chronic', 'bp', 'morning'], weight: 1.0 },
  { id: 'c-check-results', icon: 'Stethoscope', title: '体检报告有异常', subtitle: '帮我看看严不严重', query: '体检报告几项指标异常，帮我看看', tags: ['chronic'], weight: 1.0 },
  { id: 'c-exercise', icon: 'Activity', title: '有慢病能运动吗', subtitle: '运动注意事项', query: '有高血压糖尿病，能做什么运动', tags: ['chronic'], weight: 1.0 },
];

export interface GeneratorInput {
  population: Population;
  hour: number;
  month: number;
  recentQueries: string[];
  userProfile?: {
    children?: string[];      // ages as strings from onboarding
    elderConditions?: string[];
    chronicTypes?: string[];
    roles?: string[];
  };
}

function weightedSample(candidates: Suggestion[], k: number): Suggestion[] {
  const pool = [...candidates];
  const result: Suggestion[] = [];

  for (let i = 0; i < k && pool.length > 0; i++) {
    const totalWeight = pool.reduce((s, item) => s + item.weight, 0);
    if (totalWeight <= 0) break;
    let r = Math.random() * totalWeight;
    let pickedIdx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) { pickedIdx = j; break; }
    }
    result.push(pool[pickedIdx]);
    pool.splice(pickedIdx, 1);
  }
  return result;
}

export function generateSuggestions(input: GeneratorInput): Suggestion[] {
  const scored = SUGGESTION_POOL.map(s => {
    let score = 0;

    // Population match (required base)
    if (s.tags.includes(input.population)) score += 1.0;
    else return { ...s, weight: 0 };

    // Time of day
    const isNight = input.hour >= 21 || input.hour <= 5;
    const isMorning = input.hour >= 6 && input.hour <= 9;
    if (s.tags.includes('night') && isNight) score += 0.5;
    if (s.tags.includes('morning') && isMorning) score += 0.3;

    // Season
    if (s.tags.includes('flu') && [11, 12, 1, 2].includes(input.month)) score += 0.4;
    if (s.tags.includes('allergy') && [3, 4, 5].includes(input.month)) score += 0.4;
    if (s.tags.includes('heatstroke') && [6, 7, 8].includes(input.month)) score += 0.5;
    if (s.tags.includes('spring') && [3, 4, 5].includes(input.month)) score += 0.3;

    // History match
    for (const q of input.recentQueries) {
      if (s.tags.some(tag => q.includes(tag) || tag.includes(q.slice(0, 4)))) {
        score += 0.6;
        break;
      }
    }

    // Profile matching
    if (input.userProfile) {
      const profile = input.userProfile;

      // Children age boost
      if (s.tags.includes('pediatric') && profile.children && profile.children.length > 0) {
        score += 0.5;
        const hasInfant = profile.children.some(age => parseInt(age) <= 3);
        if (hasInfant && (s.tags.includes('infant') || s.tags.includes('fever'))) score += 0.3;
      }

      // Elder condition boost
      if (s.tags.includes('geriatric') && profile.elderConditions && profile.elderConditions.length > 0) {
        if (profile.elderConditions.includes('高血压') && s.tags.some(t => t.includes('bp') || t.includes('stroke'))) score += 0.4;
        if (profile.elderConditions.includes('糖尿病') && s.tags.some(t => t.includes('sugar') || t.includes('dizzy'))) score += 0.4;
        if (profile.elderConditions.includes('心脏病') && s.tags.some(t => t.includes('chest') || t.includes('heart'))) score += 0.4;
      }

      // Chronic type boost
      if (s.tags.includes('chronic') && profile.chronicTypes && profile.chronicTypes.length > 0) {
        if (profile.chronicTypes.includes('高血压') && s.tags.includes('bp')) score += 0.5;
        if (profile.chronicTypes.includes('糖尿病') && s.tags.includes('sugar')) score += 0.5;
        if (profile.chronicTypes.includes('冠心病') && s.tags.includes('heart')) score += 0.4;
      }
    }

    return { ...s, weight: score };
  });

  const candidates = scored.filter(s => s.weight > 0);

  // Guaranteed slots: score >= 2.0 go first (max 2)
  const guaranteed = candidates.filter(s => s.weight >= 2.0);
  const remaining = candidates.filter(s => s.weight < 2.0);

  const result = [...guaranteed.slice(0, 2)];
  const slotsLeft = 4 - result.length;
  const sampled = weightedSample(remaining, slotsLeft);
  result.push(...sampled);

  // Pad with population defaults if needed
  if (result.length < 4) {
    const defaults = SUGGESTION_POOL.filter(s => s.tags.includes(input.population));
    for (const d of defaults) {
      if (result.length >= 4) break;
      if (!result.some(r => r.id === d.id)) result.push(d);
    }
  }

  return result.slice(0, 4);
}

export function generateExplanation(input: GeneratorInput): string {
  const isNight = input.hour >= 21 || input.hour <= 5;
  const isMorning = input.hour >= 6 && input.hour <= 9;
  const popLabel = { self: '个人', pediatric: '孩子', geriatric: '老人', chronic: '慢病' }[input.population];
  const profile = input.userProfile;

  // Profile-specific explanations take priority
  if (profile) {
    if (input.population === 'pediatric' && profile.children?.length) {
      const youngest = Math.min(...profile.children.map(a => parseInt(a) || 99));
      if (youngest <= 3) return `💡 已根据你家 ${youngest} 岁宝宝的情况调整推荐`;
      return `💡 已根据你家 ${youngest} 岁孩子的情况调整推荐`;
    }
    if (input.population === 'geriatric' && profile.elderConditions?.length) {
      const cond = profile.elderConditions.filter(c => c !== '无')[0];
      if (cond) return `💡 已根据有${cond}的老人情况调整推荐`;
    }
    if (input.population === 'chronic' && profile.chronicTypes?.length) {
      return `💡 已根据${profile.chronicTypes[0]}管理需求调整推荐`;
    }
  }

  if (isNight) return `💡 现在是夜里，已优先显示${popLabel}相关紧急问题`;
  if (isMorning) return `💡 早上好，已为${popLabel}推荐晨间常见问题`;
  if (input.recentQueries.length > 0) return `💡 已根据你最近的关注调整推荐`;
  return `💡 根据当前时间和角色为你推荐`;
}
