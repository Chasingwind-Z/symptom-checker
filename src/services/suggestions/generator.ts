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
  // self
  { id: 's-headache', icon: 'Brain', title: '突然头痛是怎么回事', subtitle: '判断是否需要就医', query: '突然头痛，想知道严不严重', tags: ['self', 'headache'], weight: 1.0 },
  { id: 's-cold-week', icon: 'Thermometer', title: '感冒一周还没好', subtitle: '需要换药还是去医院', query: '感冒一周了还没好，需要去医院吗', tags: ['self', 'cold', 'flu'], weight: 1.0 },
  { id: 's-insomnia', icon: 'Moon', title: '失眠两周影响生活', subtitle: '了解可能原因', query: '连续失眠两周了，白天很疲惫', tags: ['self', 'night', 'insomnia'], weight: 1.0 },
  { id: 's-stomach', icon: 'Stethoscope', title: '胃痛反复发作', subtitle: '是否需要检查', query: '胃痛反复发作，不确定要不要去查', tags: ['self', 'stomach'], weight: 1.0 },
  { id: 's-allergy', icon: 'Flower2', title: '鼻子痒眼睛痒像过敏', subtitle: '如何缓解过敏', query: '鼻子和眼睛痒，像是过敏了', tags: ['self', 'allergy', 'spring'], weight: 1.0 },

  // pediatric
  { id: 'p-fever-night', icon: 'Thermometer', title: '孩子半夜发烧38.5℃', subtitle: '今晚要不要去急诊', query: '孩子半夜发烧38.5度，要去急诊吗', tags: ['pediatric', 'fever', 'night'], weight: 1.0 },
  { id: 'p-cough', icon: 'Wind', title: '宝宝咳嗽半夜加重', subtitle: '判断严重程度', query: '宝宝咳嗽，半夜特别厉害', tags: ['pediatric', 'cough', 'night'], weight: 1.0 },
  { id: 'p-diarrhea', icon: 'Droplets', title: '小孩拉肚子三次了', subtitle: '需要注意什么', query: '小孩今天拉肚子三次了', tags: ['pediatric', 'diarrhea', 'heatstroke'], weight: 1.0 },
  { id: 'p-head-bump', icon: 'AlertCircle', title: '孩子摔到头怎么办', subtitle: '紧急判断指南', query: '孩子摔倒碰到头了，需要去医院吗', tags: ['pediatric', 'injury'], weight: 1.0 },
  { id: 'p-rash', icon: 'Sparkles', title: '孩子身上出疹子', subtitle: '识别常见皮疹', query: '孩子身上突然出了很多红疹子', tags: ['pediatric', 'allergy', 'spring'], weight: 1.0 },

  // geriatric
  { id: 'g-chest', icon: 'HeartPulse', title: '老人胸闷气短', subtitle: '评估紧急程度', query: '家里老人说胸闷气短', tags: ['geriatric', 'chest', 'emergency'], weight: 1.0 },
  { id: 'g-speech', icon: 'Brain', title: '突然说话不清楚', subtitle: '可能是中风信号', query: '老人突然说话不太清楚了', tags: ['geriatric', 'stroke', 'emergency'], weight: 1.0 },
  { id: 'g-dizzy-meal', icon: 'Activity', title: '饭后头晕', subtitle: '判断原因', query: '老人每次吃完饭就头晕', tags: ['geriatric', 'dizzy', 'morning'], weight: 1.0 },
  { id: 'g-fall', icon: 'AlertCircle', title: '老人摔了一跤', subtitle: '需要去拍片吗', query: '老人摔了一跤，需要去医院检查吗', tags: ['geriatric', 'injury'], weight: 1.0 },

  // chronic
  { id: 'c-bp-high', icon: 'HeartPulse', title: '血压突然160怎么办', subtitle: '紧急处理建议', query: '血压突然升到160了怎么办', tags: ['chronic', 'bp', 'emergency'], weight: 1.0 },
  { id: 'c-sugar', icon: 'Droplets', title: '血糖空腹8.2', subtitle: '需要调药吗', query: '空腹血糖8.2，需要调整用药吗', tags: ['chronic', 'sugar', 'morning'], weight: 1.0 },
  { id: 'c-missed-med', icon: 'Pill', title: '降压药漏吃一次', subtitle: '补吃还是跳过', query: '降压药忘记吃了一次，要补吃吗', tags: ['chronic', 'medication'], weight: 1.0 },
  { id: 'c-dizzy-drug', icon: 'Brain', title: '头晕和药有关系吗', subtitle: '药物副作用判断', query: '最近头晕，不知道和吃的药有没有关系', tags: ['chronic', 'dizzy', 'medication'], weight: 1.0 },
];

interface GeneratorInput {
  population: Population;
  hour: number;
  month: number;
  recentQueries: string[];
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

    return { ...s, weight: score };
  });

  const sorted = scored
    .filter(s => s.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  // Take top 4, pad with population defaults if needed
  const result = sorted.slice(0, 4);
  if (result.length < 4) {
    const defaults = SUGGESTION_POOL.filter(s => s.tags.includes(input.population));
    for (const d of defaults) {
      if (result.length >= 4) break;
      if (!result.some(r => r.id === d.id)) result.push(d);
    }
  }

  return result.slice(0, 4);
}
