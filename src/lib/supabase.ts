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
    console.warn('[Supabase] 初始化失败，已回退到本机模式。', initError);
  }

  return browserClient;
}

export function getSupabaseBootstrapStatus(): SupabaseBootstrapStatus {
  if (initError) {
    return {
      state: 'error',
      label: '云端初始化失败',
      helperText: initError.message,
    };
  }

  if (!isSupabaseConfigured) {
    return {
      state: 'unconfigured',
      label: '本机模式（未连接云端）',
      helperText: '缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，当前自动使用浏览器本机缓存。',
    };
  }

  return {
    state: 'ready',
    label: '云端已就绪，可开启登录',
    helperText: 'Supabase 客户端可用，邮箱 magic link、档案同步与问诊历史都可以接入。',
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
    console.warn('[Supabase] 获取会话失败：', error.message);
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
    console.warn('[Supabase] 发送 magic link 失败：', error.message);
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
      message: '当前就是本机模式，无需退出账号。',
    };
  }

  const { error } = await client.auth.signOut();
  if (error) {
    console.warn('[Supabase] 退出登录失败：', error.message);
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
