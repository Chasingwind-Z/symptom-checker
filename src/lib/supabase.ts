/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

type AppSupabaseClient = SupabaseClient<any>;

let browserClient: AppSupabaseClient | null = null;
let initError: Error | null = null;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface SupabaseBootstrapStatus {
  state: 'unconfigured' | 'ready' | 'error';
  label: string;
  helperText: string;
}

export interface SupabaseAuthActionResult {
  ok: boolean;
  message: string;
}

const shouldLogSupabase = import.meta.env.DEV;

export function getSupabaseClient(): AppSupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (browserClient || initError) {
    return browserClient;
  }

  try {
    browserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Supabase 初始化失败');
    if (shouldLogSupabase) {
      console.warn('[Supabase] 初始化失败，已回退到游客模式。', initError);
    }
  }

  return browserClient;
}

export function getSupabaseBootstrapStatus(): SupabaseBootstrapStatus {
  if (initError) {
    return {
      state: 'error',
      label: '云端同步暂不可用',
      helperText: '当前自动降级为游客模式，资料仍会保存在当前浏览器。',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      state: 'unconfigured',
      label: '游客模式（仅当前浏览器保存）',
      helperText: '可直接开始问诊；登录后可同步档案、历史会话和随访结果。',
    };
  }

  return {
    state: 'ready',
    label: '已支持邮箱登录同步',
    helperText: '登录后可跨设备查看健康档案、历史会话与同步结果。',
  };
}

function getEmailRedirectUrl() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}${window.location.pathname}`;
}

export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    if (shouldLogSupabase) {
      console.warn('[Supabase] 获取会话失败：', error.message);
    }
    return null;
  }

  return data.session;
}

export async function getSupabaseUser(): Promise<User | null> {
  const session = await getSupabaseSession();
  return session?.user ?? null;
}

export async function sendMagicLink(email: string): Promise<SupabaseAuthActionResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return {
      ok: false,
      message: '请输入常用邮箱后再继续。',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: '当前尚未填写 Supabase 配置，请先补齐 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。',
    };
  }

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    if (shouldLogSupabase) {
      console.warn('[Supabase] 发送 magic link 失败：', error.message);
    }
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: `登录链接已发送到 ${normalizedEmail}，请在邮箱中打开后返回本页继续使用。`,
  };
}

export async function signInWithMagicLink(email: string): Promise<SupabaseAuthActionResult> {
  return sendMagicLink(email);
}

export async function signOutSupabase(): Promise<SupabaseAuthActionResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: true,
      message: '当前处于游客模式，无需退出账号。',
    };
  }

  const { error } = await client.auth.signOut();
  if (error) {
    if (shouldLogSupabase) {
      console.warn('[Supabase] 退出登录失败：', error.message);
    }
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: '已退出云端账号，当前继续使用本机缓存。',
  };
}

export function subscribeToSupabaseAuth(callback: () => void) {
  const client = getSupabaseClient();
  if (!client) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(() => {
    callback();
  });

  return () => subscription.unsubscribe();
}
