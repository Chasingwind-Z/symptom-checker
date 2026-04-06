/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_PROVIDER?: string;
  readonly VITE_INTERNAL_API_BASE_URL?: string;
  readonly VITE_AI_BASE_URL?: string;
  readonly VITE_AI_MODEL?: string;
  readonly VITE_AI_API_KEY?: string;
  readonly VITE_AMAP_KEY?: string;
  readonly VITE_AMAP_JS_KEY?: string;
  readonly VITE_AMAP_JS_SECURITY_KEY?: string;
  readonly VITE_AMAP_WEB_KEY?: string;
  readonly VITE_QWEATHER_KEY?: string;
  readonly VITE_QWEATHER_HOST?: string;
  readonly VITE_TAVILY_API_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /**
   * Explicit override for whether the configured AI model supports vision
   * (image_url content parts in the messages array).
   *
   * - Set to "true" / "1" / "yes"  → vision always enabled
   * - Set to "false" / "0" / "no"  → vision always disabled (text-assist mode)
   * - Omit entirely                → inferred from VITE_AI_MODEL name
   *
   * Known auto-detected vision models include: mimo-v2-omni, gpt-4o,
   * gpt-4-vision, gpt-4-turbo, claude-3, gemini-pro-vision, gemini-1.5,
   * gemini-2, qwen-vl, internvl, llava.
   *
   * Set this explicitly when deploying a custom or self-hosted endpoint where
   * model-name inference would be incorrect.
   *
   * @example VITE_AI_SUPPORTS_VISION=true
   */
  readonly VITE_AI_SUPPORTS_VISION?: string;
  /**
   * Optional explicit site root URL used as the `emailRedirectTo` destination
   * for magic-link and verification emails.  Must match one of the Allowed
   * Redirect URLs configured in the Supabase Dashboard.
   * Example: https://your-app.vercel.app
   */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
