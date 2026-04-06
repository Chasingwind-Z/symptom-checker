import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { HealthWorkspaceSnapshot } from '../lib/healthData';
import {
  getEmailRedirectUrl,
  maskEmail,
  resendVerificationEmail,
  sendMagicLink,
  signInWithPassword,
  signOutSupabase,
  signUpWithPassword,
} from '../lib/supabase';

interface AuthDialogProps {
  isOpen: boolean;
  mode: HealthWorkspaceSnapshot['mode'];
  sessionEmail: string | null;
  onClose: () => void;
  onRefresh: () => Promise<void> | void;
}

type AuthMode = 'magic-link' | 'login' | 'register';

type AuthState = {
  kind: 'idle' | 'success' | 'error';
  message: string;
};

interface PendingEmailAction {
  type: 'magic-link' | 'verify-email';
  email: string;
  hasSentEmail: boolean;
}

const RESEND_COOLDOWN_SECONDS = 45;
const SUCCESS_AUTO_CLOSE_MS = 2200;
const IDLE_AUTH_STATE: AuthState = {
  kind: 'idle',
  message: '',
};

function getAuthModeLabel(mode: AuthMode) {
  if (mode === 'magic-link') return '邮箱免密登录';
  return mode === 'login' ? '密码登录' : '注册新账号';
}

function getAuthModeDescription(mode: AuthMode) {
  if (mode === 'magic-link') {
    return '输入邮箱后会收到一封登录邮件。点击邮件里的继续登录后，浏览器会自动回到当前产品，无需记密码。';
  }

  if (mode === 'register') {
    return '设置密码后会收到验证邮件。验证完成后，可长期使用同一邮箱同步档案和历史问诊。';
  }

  return '如果已经设置过密码，可直接登录；若还没验证完成，也可以改用邮箱免密登录。';
}

function getPendingEmailTitle(pendingEmailAction: PendingEmailAction) {
  if (pendingEmailAction.type === 'magic-link') {
    return '去邮箱点击登录链接';
  }

  return pendingEmailAction.hasSentEmail ? '去邮箱完成验证' : '这个邮箱还没完成验证';
}

function getPendingEmailDescription(
  pendingEmailAction: PendingEmailAction,
  maskedEmail: string
) {
  if (pendingEmailAction.type === 'magic-link') {
    return `我们已把登录邮件发到 ${maskedEmail}。点击邮件里的继续登录后，浏览器会自动跳回当前页面并完成登录。`;
  }

  if (pendingEmailAction.hasSentEmail) {
    return `验证邮件已发到 ${maskedEmail}。完成验证后，浏览器会自动跳回当前页面；如果状态还没更新，可点下方“已完成，刷新状态”。`;
  }

  return `${maskedEmail} 还没有完成邮箱验证。重新发送验证邮件后，完成验证即可回到这里继续同步。`;
}

function getResendButtonLabel(
  pendingEmailAction: PendingEmailAction,
  resendCountdown: number
) {
  const baseLabel =
    pendingEmailAction.type === 'magic-link'
      ? '重新发送登录链接'
      : pendingEmailAction.hasSentEmail
        ? '重新发送验证邮件'
        : '发送验证邮件';

  return resendCountdown > 0 ? `${baseLabel} (${resendCountdown}s)` : baseLabel;
}

export function AuthDialog({
  isOpen,
  mode,
  sessionEmail,
  onClose,
  onRefresh,
}: AuthDialogProps) {
  const [authEmail, setAuthEmail] = useState(sessionEmail ?? '');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [authState, setAuthState] = useState<AuthState>(IDLE_AUTH_STATE);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pendingEmailAction, setPendingEmailAction] = useState<PendingEmailAction | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const previousSessionEmailRef = useRef(sessionEmail);

  const isCloudConfigured = mode === 'cloud-ready' || mode === 'cloud-session';
  const isSignedIn = Boolean(sessionEmail);
  const redirectUrl = getEmailRedirectUrl() ?? (typeof window !== 'undefined' ? window.location.origin : '');
  const maskedSessionEmail = sessionEmail ? maskEmail(sessionEmail) : '';
  const maskedPendingEmail = pendingEmailAction ? maskEmail(pendingEmailAction.email) : '';
  const isAwaitingEmailAction = Boolean(pendingEmailAction) && !isSignedIn;
  const canSubmitAuth =
    Boolean(authEmail.trim()) &&
    (authMode === 'magic-link' || Boolean(authPassword));
  const authSummary = useMemo(() => {
    if (isSignedIn) {
      return '当前邮箱已连接，同一账号下可以继续同步档案、历史会话和最近问诊摘要。';
    }

    if (!isCloudConfigured) {
      return '当前未启用云端同步，仍可继续以游客模式使用。';
    }

    return isAwaitingEmailAction && pendingEmailAction
      ? getPendingEmailDescription(
          pendingEmailAction,
          maskedPendingEmail || pendingEmailAction.email
        )
      : getAuthModeDescription(authMode);
  }, [
    authMode,
    isAwaitingEmailAction,
    isCloudConfigured,
    isSignedIn,
    maskedPendingEmail,
    pendingEmailAction,
  ]);

  function clearPendingEmailAction() {
    setPendingEmailAction(null);
    setResendCountdown(0);
  }

  useEffect(() => {
    if (!isOpen) return;

    setAuthEmail(sessionEmail ?? authEmail);
  }, [authEmail, isOpen, sessionEmail]);

  useEffect(() => {
    const previousSessionEmail = previousSessionEmailRef.current;
    previousSessionEmailRef.current = sessionEmail;

    if (!sessionEmail || !isOpen || previousSessionEmail === sessionEmail) return;

    clearPendingEmailAction();
    setAuthPassword('');
    setShowPassword(false);
    setAuthState({
      kind: 'success',
      message: `已连接 ${maskEmail(sessionEmail)}，档案、历史会话和最近问诊将自动同步。`,
    });

    const timer = window.setTimeout(() => {
      onClose();
    }, SUCCESS_AUTO_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [isOpen, onClose, sessionEmail]);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = window.setTimeout(() => {
      setResendCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function handleAuthModeChange(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthPassword('');
    setShowPassword(false);
    setAuthState(IDLE_AUTH_STATE);
  }

  function handleChangeEmail() {
    if (pendingEmailAction?.email) {
      setAuthEmail(pendingEmailAction.email);
    }

    clearPendingEmailAction();
    setAuthState(IDLE_AUTH_STATE);
  }

  async function handleAuth() {
    setIsAuthLoading(true);
    setAuthState(IDLE_AUTH_STATE);

    try {
      const result =
        authMode === 'magic-link'
          ? await sendMagicLink(authEmail)
          : authMode === 'register'
            ? await signUpWithPassword(authEmail, authPassword)
            : await signInWithPassword(authEmail, authPassword);

      setAuthState({ kind: result.ok ? 'success' : 'error', message: result.message });

      if (!result.ok) {
        if (result.nextStep === 'verify-email' && result.email) {
          setPendingEmailAction({
            type: 'verify-email',
            email: result.email,
            hasSentEmail: false,
          });
          setResendCountdown(0);
        }
        return;
      }

      if (result.nextStep === 'magic-link-sent' && result.email) {
        setPendingEmailAction({
          type: 'magic-link',
          email: result.email,
          hasSentEmail: true,
        });
        setResendCountdown(RESEND_COOLDOWN_SECONDS);
        setAuthPassword('');
        setShowPassword(false);
        return;
      }

      if (result.nextStep === 'verify-email' && result.email) {
        setPendingEmailAction({
          type: 'verify-email',
          email: result.email,
          hasSentEmail: true,
        });
        setResendCountdown(RESEND_COOLDOWN_SECONDS);
        setAuthPassword('');
        setShowPassword(false);
        return;
      }

      clearPendingEmailAction();
      setAuthPassword('');
      setShowPassword(false);

      if (result.nextStep === 'signed-in') {
        await Promise.resolve(onRefresh());
      }
    } catch {
      setAuthState({
        kind: 'error',
        message: '暂时无法完成邮箱操作，请稍后重试。',
      });
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleResendPendingAction() {
    if (!pendingEmailAction) return;

    setIsAuthLoading(true);
    setAuthState(IDLE_AUTH_STATE);

    try {
      const result =
        pendingEmailAction.type === 'magic-link'
          ? await sendMagicLink(pendingEmailAction.email)
          : await resendVerificationEmail(pendingEmailAction.email);

      setAuthState({ kind: result.ok ? 'success' : 'error', message: result.message });

      if (result.ok) {
        setPendingEmailAction({
          type: pendingEmailAction.type,
          email: result.email ?? pendingEmailAction.email,
          hasSentEmail: true,
        });
        setResendCountdown(RESEND_COOLDOWN_SECONDS);
      }
    } catch {
      setAuthState({
        kind: 'error',
        message: '暂时无法重新发送邮件，请稍后重试。',
      });
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleRefreshAuthStatus() {
    await Promise.resolve(onRefresh());
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await signOutSupabase();
      setAuthState({
        kind: result.ok ? 'success' : 'error',
        message: result.message,
      });

      if (result.ok) {
        clearPendingEmailAction();
        setAuthPassword('');
        setShowPassword(false);
      }

      await Promise.resolve(onRefresh());
    } catch {
      setAuthState({
        kind: 'error',
        message: '暂时无法退出登录，请稍后重试。',
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-600">
              <ShieldCheck size={13} className="text-cyan-600" />
              {isSignedIn ? '账号设置' : '登录 / 注册'}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {isSignedIn ? '管理同步账号' : '打开云端同步'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{authSummary}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭登录窗口"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-4">
          {isSignedIn ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800">已连接邮箱</p>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {maskedSessionEmail || sessionEmail}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  新的档案修改和最近问诊会自动同步到云端；退出后，这台设备上的本地缓存仍会保留。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleRefreshAuthStatus();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw size={14} />
                  刷新状态
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={14} />
                  {isSigningOut ? '退出中…' : '退出登录'}
                </button>
              </div>
            </div>
          ) : !isCloudConfigured ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-500">
              当前环境尚未启用云端同步配置。你仍可继续以游客模式使用，资料会保存在当前浏览器。
            </div>
          ) : isAwaitingEmailAction && pendingEmailAction ? (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-4">
              <div className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 text-cyan-600" />
                <div className="min-w-0 flex-1">
                  <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] text-slate-500">
                    <ShieldCheck size={12} className="shrink-0 text-cyan-600" />
                    <span className="truncate">邮件完成后将返回当前产品 · {redirectUrl}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {getPendingEmailTitle(pendingEmailAction)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {getPendingEmailDescription(
                      pendingEmailAction,
                      maskedPendingEmail || pendingEmailAction.email
                    )}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {pendingEmailAction.hasSentEmail
                      ? `没看到邮件？可检查垃圾邮件，或在 ${
                          resendCountdown > 0 ? `${resendCountdown}s` : '现在'
                        } 后重新发送。`
                      : '确认邮箱可用后，可以重新发送一封验证邮件。'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleResendPendingAction();
                  }}
                  disabled={isAuthLoading || resendCountdown > 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-sm text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Mail size={14} />
                  {isAuthLoading
                    ? '处理中…'
                    : getResendButtonLabel(pendingEmailAction, resendCountdown)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleRefreshAuthStatus();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw size={14} />
                  已完成，刷新状态
                </button>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  换个邮箱
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['magic-link', 'login', 'register'] as const).map((modeOption) => (
                  <button
                    key={modeOption}
                    type="button"
                    onClick={() => handleAuthModeChange(modeOption)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      authMode === modeOption
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {getAuthModeLabel(modeOption)}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                  邮箱地址
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(event) => {
                      setAuthEmail(event.target.value);
                      if (authState.kind !== 'idle') {
                        setAuthState(IDLE_AUTH_STATE);
                      }
                    }}
                    placeholder="name@example.com"
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-cyan-300"
                  />
                </label>

                {authMode !== 'magic-link' && (
                  <label className="flex flex-col gap-1 text-[11px] text-slate-500">
                    {authMode === 'register' ? '设置密码' : '密码'}
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={authPassword}
                        onChange={(event) => {
                          setAuthPassword(event.target.value);
                          if (authState.kind !== 'idle') {
                            setAuthState(IDLE_AUTH_STATE);
                          }
                        }}
                        placeholder={authMode === 'register' ? '至少 6 位密码' : '请输入密码'}
                        className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-700 outline-none transition-colors focus:border-cyan-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => {
                    void handleAuth();
                  }}
                  disabled={isAuthLoading || !canSubmitAuth}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-cyan-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Mail size={14} />
                  {isAuthLoading
                    ? '处理中…'
                    : authMode === 'login'
                      ? '登录并同步'
                      : authMode === 'register'
                        ? '创建账号'
                        : '发送登录链接'}
                </button>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                {authMode === 'magic-link'
                  ? '推荐：适合在手机和电脑之间快速继续问诊，不需要手机号，也不用记密码。'
                  : authMode === 'register'
                    ? '创建账号后会收到一封验证邮件；验证完成后，可长期使用同一邮箱同步。'
                    : '如果这个邮箱还没验证成功，可先完成验证，或直接改用邮箱登录链接。'}
              </p>
            </div>
          )}

          {authState.kind !== 'idle' && (
            <p
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                authState.kind === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-rose-100 bg-rose-50 text-rose-700'
              }`}
            >
              {authState.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
