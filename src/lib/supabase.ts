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
  email?: string;
  nextStep?: 'magic-link-sent' | 'verify-email' | 'signed-in' | 'signed-out';
}

const shouldLogSupabase = import.meta.env.DEV;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function maskEmail(email: string | null | undefined) {
  if (!email) return '';

  const normalizedEmail = normalizeEmail(email);
  const [localPart, domain] = normalizedEmail.split('@');
  if (!localPart || !domain) {
    return normalizedEmail;
  }

  const visibleLocal = localPart.slice(0, Math.min(2, localPart.length));
  return `${visibleLocal}${'*'.repeat(Math.max(localPart.length - visibleLocal.length, 1))}@${domain}`;
}

function toFriendlyAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('unable to validate email address') ||
    normalizedMessage.includes('invalid email')
  ) {
    return '请输入有效的邮箱地址。';
  }

  if (normalizedMessage.includes('invalid login credentials')) {
    return '邮箱或密码不正确，请检查后重试，也可以改用邮箱登录链接。';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return '这个邮箱还没有完成验证，请先打开验证邮件，或重新发送邮箱登录链接。';
  }

  if (
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('user already registered')
  ) {
    return '这个邮箱已经有账号了，直接登录或发送邮箱登录链接即可。';
  }

  if (
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('security purposes')
  ) {
    return '发送过于频繁，请稍等约 1 分钟后再试。';
  }

  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('networkerror')
  ) {
    return '网络连接不稳定，暂时无法连接云端，请稍后重试。';
  }

  return message;
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
    if (shouldLogSupabase) {
      if (import.meta.env.DEV) {
        console.warn('[Supabase] 初始化失败，已回退到游客模式。', initError);
      }
    }
  }

  return browserClient;
}

export function getSupabaseBootstrapStatus(): SupabaseBootstrapStatus {
  if (initError) {
    return {
      state: 'error',
      label: '邮箱同步暂不可用',
      helperText: '当前会先回退到仅本设备保存，你的资料和记录仍可继续使用。',
    };
  }

  if (!isSupabaseConfigured) {
    return {
      state: 'unconfigured',
      label: '未登录 · 仅本设备保存',
      helperText: '可直接开始问诊；接入邮箱登录后即可跨设备继续查看资料与问诊记录。',
    };
  }

  return {
    state: 'ready',
    label: '支持邮箱登录同步',
    helperText: '输入邮箱后即可继续；登录后可跨设备查看资料、历史问诊与同步结果。',
  };
}

/**
 * Resolves the URL that Supabase will redirect back to after a user clicks a
 * magic-link or verification email.
 *
 * Resolution order:
 *  1. `VITE_SITE_URL` env var — set this in production to the exact origin of
 *     your deployment (e.g. https://your-app.vercel.app).  The value must also
 *     appear in Supabase Dashboard → Authentication → URL Configuration →
 *     Allowed Redirect URLs.
 *  2. `window.location.origin + "/"` — stable root path, avoids accidentally
 *     encoding a deep sub-path that is not in the allow-list.
 */
export function getEmailRedirectUrl(): string | undefined {
  const envSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (envSiteUrl) {
    return envSiteUrl.endsWith('/') ? envSiteUrl : `${envSiteUrl}/`;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/`;
}

export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    if (shouldLogSupabase) {
      if (import.meta.env.DEV) {
        console.warn('[Supabase] 获取会话失败：', error.message);
      }
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
  const normalizedEmail = normalizeEmail(email);
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
      if (import.meta.env.DEV) {
        console.warn('[Supabase] 发送 magic link 失败：', error.message);
      }
    }
    return {
      ok: false,
      email: normalizedEmail,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    email: normalizedEmail,
    nextStep: 'magic-link-sent',
    message: `登录链接已发送到 ${maskEmail(normalizedEmail)}。请打开邮件中的继续登录按钮，然后回到这里继续同步。`,
  };
}

export async function signInWithMagicLink(email: string): Promise<SupabaseAuthActionResult> {
  return sendMagicLink(email);
}

export async function signUpWithPassword(email: string, password: string): Promise<SupabaseAuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { ok: false, message: '请输入邮箱和密码。' };
  }
  if (password.length < 6) {
    return { ok: false, message: '请设置至少 6 位密码。' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: '云端服务暂不可用，请稍后重试。' };
  }

  const { data, error } = await client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });

  if (error) {
    return {
      ok: false,
      email: normalizedEmail,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  const isExistingAccount =
    Array.isArray(data.user?.identities) && data.user.identities.length === 0;

  if (isExistingAccount) {
    return {
      ok: false,
      email: normalizedEmail,
      message: '这个邮箱已经有账号了，直接登录或发送邮箱登录链接即可。',
    };
  }

  if (data.session) {
    return {
      ok: true,
      email: normalizedEmail,
      nextStep: 'signed-in',
      message: '注册完成，正在同步你的资料。',
    };
  }

  return {
    ok: true,
    email: normalizedEmail,
    nextStep: 'verify-email',
    message: `验证邮件已发送到 ${maskEmail(normalizedEmail)}。完成验证后即可回到这里继续同步。`,
  };
}

export async function resendVerificationEmail(
  email: string
): Promise<SupabaseAuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { ok: false, message: '请输入常用邮箱后再继续。' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: '云端服务暂不可用，请稍后重试。' };
  }

  const { error } = await client.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
    },
  });

  if (error) {
    return {
      ok: false,
      email: normalizedEmail,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    email: normalizedEmail,
    nextStep: 'verify-email',
    message: `验证邮件已重新发送到 ${maskEmail(normalizedEmail)}。请打开邮件完成验证。`,
  };
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthActionResult> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    return { ok: false, message: '请输入邮箱和密码。' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: '云端服务暂不可用，请稍后重试。' };
  }

  const { error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      ok: false,
      email: normalizedEmail,
      nextStep: error.message.toLowerCase().includes('email not confirmed') ? 'verify-email' : undefined,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    email: normalizedEmail,
    nextStep: 'signed-in',
    message: `欢迎回来，${maskEmail(normalizedEmail)} 的资料正在同步。`,
  };
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
      if (import.meta.env.DEV) {
        console.warn('[Supabase] 退出登录失败：', error.message);
      }
    }
    return {
      ok: false,
      message: toFriendlyAuthErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    nextStep: 'signed-out',
    message: '已退出邮箱同步，当前继续使用本机缓存。',
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
