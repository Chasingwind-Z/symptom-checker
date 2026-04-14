export type ModelTier = 'flash' | 'pro' | 'omni' | 'auto';

export interface ModelConfig {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const MODEL_TIERS: Record<Exclude<ModelTier, 'auto'>, ModelConfig> = {
  flash: {
    id: 'mimo-v2-flash',
    label: '快速',
    description: '响应快，适合简单问题',
    emoji: '⚡',
  },
  pro: {
    id: 'mimo-v2-pro',
    label: '深度',
    description: '推理最强，适合复杂医学判断',
    emoji: '🧠',
  },
  omni: {
    id: 'mimo-v2-omni',
    label: '多模态',
    description: '支持图片分析',
    emoji: '👁️',
  },
};

const USER_PREF_KEY = 'ai_model_preference';

export function getUserModelPreference(): ModelTier {
  const saved = localStorage.getItem(USER_PREF_KEY);
  if (saved && (saved === 'flash' || saved === 'pro' || saved === 'omni' || saved === 'auto')) {
    return saved;
  }
  return 'auto';
}

export function setUserModelPreference(tier: ModelTier): void {
  localStorage.setItem(USER_PREF_KEY, tier);
}

/**
 * Auto-routing logic (inspired by ChatGPT-style adaptive routing):
 *
 * 1. Has images → omni (always, regardless of preference)
 * 2. User preference is not 'auto' → use that preference
 * 3. Auto mode heuristics:
 *    - RED urgency → flash (speed matters in emergencies)
 *    - First message & short/simple → flash (triage quickly)
 *    - Deep conversation (5+ messages) → pro (complex reasoning)
 *    - Long/detailed user input → pro (needs deep analysis)
 *    - Default → flash (fast first, escalate if needed)
 */

const COMPLEX_KEYWORDS = [
  '慢性', '长期', '反复', '多种', '同时',
  '药物', '相互作用', '禁忌', '过敏史',
  '手术', '化疗', '放疗', '透析',
  '怀孕', '孕期', '哺乳',
  '糖尿病', '高血压', '心脏', '肝', '肾',
  '并发症', '恶化', '加重',
];

function estimateComplexity(lastUserMessage?: string, messageCount?: number): 'simple' | 'moderate' | 'complex' {
  const msgLen = lastUserMessage?.length ?? 0;
  const count = messageCount ?? 0;

  // Deep conversation signals complexity
  if (count >= 5) return 'complex';

  // Long detailed message
  if (msgLen > 120) return 'complex';

  // Check for medical complexity keywords
  if (lastUserMessage && COMPLEX_KEYWORDS.some((kw) => lastUserMessage.includes(kw))) {
    return 'complex';
  }

  // Medium-length message with some detail
  if (msgLen > 50) return 'moderate';

  return 'simple';
}

export function selectModel(options: {
  hasImages: boolean;
  userPreference: ModelTier;
  urgencyLevel?: 'red' | 'yellow' | 'green';
  messageCount?: number;
  lastUserMessage?: string;
}): { modelId: string; tier: Exclude<ModelTier, 'auto'>; reason: string } {
  const { hasImages, userPreference, urgencyLevel, messageCount, lastUserMessage } = options;

  // Images always force omni
  if (hasImages) {
    return { modelId: MODEL_TIERS.omni.id, tier: 'omni', reason: '检测到图片，使用多模态模型' };
  }

  // Manual override (non-auto)
  if (userPreference !== 'auto') {
    const tier = userPreference as Exclude<ModelTier, 'auto'>;
    return { modelId: MODEL_TIERS[tier].id, tier, reason: `手动选择：${MODEL_TIERS[tier].label}` };
  }

  // Auto routing — emergency always fast
  if (urgencyLevel === 'red') {
    return { modelId: MODEL_TIERS.flash.id, tier: 'flash', reason: '紧急情况，快速响应' };
  }

  const complexity = estimateComplexity(lastUserMessage, messageCount);

  if (complexity === 'complex') {
    return { modelId: MODEL_TIERS.pro.id, tier: 'pro', reason: '复杂问题，深度推理' };
  }

  // Simple & moderate → flash for speed
  return { modelId: MODEL_TIERS.flash.id, tier: 'flash', reason: '快速分析' };
}
