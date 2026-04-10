export type UrgencyLevel = 'red' | 'yellow' | 'green';

const RED_KEYWORDS = [
  '意识不清', '抽搐', '昏迷', '呼吸困难', '大量出血',
  '胸口剧痛', '嘴唇发紫', '叫不醒', '不省人事',
  '头部撞击后呕吐', '窒息', '心脏骤停', '没有呼吸',
  '偏瘫', '言语不清', '口角歪斜', '突然不能动',
];

const YELLOW_KEYWORDS = [
  '发烧', '呕吐', '吐了', '拉肚子', '胸闷', '气短',
  '头晕', '摔倒', '去医院', '去急诊', '挂什么科',
  '要不要去', '严不严重', '血压高', '血糖高',
  '发热', '腹泻', '肚子疼', '心慌', '喘不上气',
];

export function quickTriage(message: string): UrgencyLevel {
  const msg = message.toLowerCase();
  if (RED_KEYWORDS.some(k => msg.includes(k))) return 'red';
  if (YELLOW_KEYWORDS.some(k => msg.includes(k))) return 'yellow';
  return 'green';
}

export function getMaxFollowups(urgency: UrgencyLevel): number {
  switch (urgency) {
    case 'red': return 0;
    case 'yellow': return 3;
    case 'green': return 5;
  }
}
