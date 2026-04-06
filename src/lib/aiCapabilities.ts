/**
 * Shared AI capability module.
 *
 * Priority order for vision support:
 *   1. VITE_AI_SUPPORTS_VISION env var  (explicit override — always wins)
 *   2. Model-name inference             (conservative, opt-in list below)
 *   3. Default: false                   (safe fallback, text-assist mode)
 *
 * To add support for a new vision-capable model, append its lowercase
 * name fragment to VISION_MODEL_PATTERNS below.
 */

/** Lowercase substrings that reliably identify vision-capable models. */
const VISION_MODEL_PATTERNS: readonly string[] = [
  'mimo-v2-omni',    // Xiaomi MiMo-V2-Omni
  'gpt-4o',          // OpenAI GPT-4o family
  'gpt-4-vision',    // OpenAI GPT-4-vision-preview
  'gpt-4-turbo',     // OpenAI GPT-4-Turbo (vision-capable variant)
  'claude-3',        // Anthropic Claude 3 family
  'gemini-pro-vision',
  'gemini-1.5',      // Google Gemini 1.5 family
  'gemini-2',        // Google Gemini 2 family
  'qwen-vl',         // Alibaba Qwen-VL
  'internvl',        // InternVL open-source series
  'llava',           // LLaVA family
];

/** Infer vision capability from model name string (conservative, substring match). */
function inferVisionFromModel(model?: string): boolean {
  if (!model) return false;
  const lower = model.toLowerCase();
  return VISION_MODEL_PATTERNS.some((pattern) => lower.includes(pattern));
}

/** Resolve whether vision is enabled for the current deployment. */
function resolveVisionEnabled(): boolean {
  const explicit = import.meta.env.VITE_AI_SUPPORTS_VISION;

  // Explicit override: any non-empty string value is treated as a deliberate signal.
  if (explicit !== undefined && explicit !== '') {
    return /^(1|true|yes)$/i.test(String(explicit));
  }

  // Inference fallback: use model name when no explicit flag is set.
  return inferVisionFromModel(import.meta.env.VITE_AI_MODEL);
}

/**
 * Whether the configured model accepts image_url content parts.
 * Computed once at module load; treated as a build-time constant.
 */
export const AI_VISION_ENABLED: boolean = resolveVisionEnabled();

/** 'visual' when the model processes image pixels; 'text-assist' otherwise. */
export type VisionMode = 'visual' | 'text-assist';

export function getVisionMode(): VisionMode {
  return AI_VISION_ENABLED ? 'visual' : 'text-assist';
}

/** Short human-readable label for the current image handling mode (Chinese UI). */
export function getVisionModeLabel(): string {
  return AI_VISION_ENABLED ? '图像识别' : '文字辅助';
}

export interface AICapabilities {
  /** Whether the configured model accepts image_url content parts. */
  vision: boolean;
  /** How images are handled: direct pixel access vs filename/type text context. */
  visionMode: VisionMode;
  /** Whether the browser exposes a SpeechRecognition API. */
  speechInput: boolean;
}

/** Snapshot of current AI + browser capabilities. Safe to call at render time. */
export function getAICapabilities(): AICapabilities {
  const speechInput =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  return {
    vision: AI_VISION_ENABLED,
    visionMode: getVisionMode(),
    speechInput,
  };
}
