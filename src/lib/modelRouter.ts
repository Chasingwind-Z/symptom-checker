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
 * Auto-routing logic:
 * - Has images → omni (always, regardless of preference)
 * - User preference is not 'auto' → use that preference
 * - Auto mode: RED urgency → flash (speed matters)
 *              Complex/chronic → pro (reasoning matters)
 *              Default → pro
 */
export function selectModel(options: {
  hasImages: boolean;
  userPreference: ModelTier;
  urgencyLevel?: 'red' | 'yellow' | 'green';
  messageCount?: number;
}): { modelId: string; tier: Exclude<ModelTier, 'auto'>; reason: string } {
  const { hasImages, userPreference, urgencyLevel } = options;

  // Images always force omni
  if (hasImages) {
    return { modelId: MODEL_TIERS.omni.id, tier: 'omni', reason: '检测到图片，使用多模态模型' };
  }

  // Manual override (non-auto)
  if (userPreference !== 'auto') {
    const tier = userPreference as Exclude<ModelTier, 'auto'>;
    return { modelId: MODEL_TIERS[tier].id, tier, reason: `手动选择：${MODEL_TIERS[tier].label}` };
  }

  // Auto routing
  if (urgencyLevel === 'red') {
    return { modelId: MODEL_TIERS.flash.id, tier: 'flash', reason: '紧急情况，快速响应' };
  }

  // Default: pro for medical reasoning
  return { modelId: MODEL_TIERS.pro.id, tier: 'pro', reason: '深度推理分析' };
}
