import { AlertTriangle, RefreshCw, Stethoscope } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppShellErrorBoundaryProps {
  children: ReactNode;
}

interface AppShellErrorBoundaryState {
  hasError: boolean;
}

export class AppShellErrorBoundary extends Component<
  AppShellErrorBoundaryProps,
  AppShellErrorBoundaryState
> {
  state: AppShellErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppShellErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppShellErrorBoundary] 应用外壳渲染失败', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 px-4 py-8 text-slate-900">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <section className="w-full rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-200/60 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <div className="rounded-lg bg-blue-600 p-1 text-white">
                <Stethoscope size={14} />
              </div>
              健康助手保护模式
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">页面暂时出了点问题</h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  我们已经拦住了这次异常，避免出现整页白屏。刷新后会尽量恢复本机草稿、历史会话和已登录状态。
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <RefreshCw size={15} />
                刷新并继续使用
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }
}
