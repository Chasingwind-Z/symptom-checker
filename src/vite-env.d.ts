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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
