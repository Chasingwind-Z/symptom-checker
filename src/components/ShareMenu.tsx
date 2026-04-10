import { useState, useRef, useEffect } from 'react';
import { Share2, MessageCircle, ClipboardList, Printer } from 'lucide-react';
import type { DiagnosisResult, Message } from '../types';

interface ShareMenuProps {
  result: DiagnosisResult;
  messages: Message[];
  consultationModeId?: string;
}

const LEVEL_EMOJI: Record<string, string> = {
  green: '🟢', yellow: '🟡', orange: '🟠', red: '🔴',
};

export function ShareMenu({ result, messages, consultationModeId }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const chiefComplaint = messages.find(m => m.role === 'user')?.content.slice(0, 50) || '症状咨询';
  const emoji = LEVEL_EMOJI[result.level] || '⚪';
  const modeLabel = consultationModeId === 'child' ? '孩子' : consultationModeId === 'elderly' ? '老人' : '';

  const handleWechat = () => {
    const text = [
      `【健康助手 · 决策建议】`,
      `📋 情况：${chiefComplaint}`,
      `${emoji} 紧急度：${result.level === 'green' ? '可居家观察' : result.level === 'yellow' ? '建议就诊' : result.level === 'orange' ? '今日就医' : '立即急诊'}`,
      `💊 建议：${result.action}`,
      `🏥 科室：${result.departments.join('、')}`,
      ``,
      `⚠️ ${result.disclaimer}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied('wechat');
      setTimeout(() => setCopied(null), 2000);
    });
    setOpen(false);
  };

  const handleDoctor = () => {
    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content.slice(0, 80));
    const text = [
      `主诉：${chiefComplaint}`,
      `时间：${new Date().toLocaleString('zh-CN')}`,
      ``,
      `症状描述：`,
      ...userMsgs.map(m => `- ${m}`),
      ``,
      `AI 建议：${result.action}`,
      `建议科室：${result.departments.join('、')}`,
      `风险等级：${result.level}`,
      ``,
      `${result.disclaimer}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied('doctor');
      setTimeout(() => setCopied(null), 2000);
    });
    setOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-colors"
      >
        <Share2 size={14} />
        {modeLabel ? `发给${modeLabel === '孩子' ? '另一半' : '其他家属'}` : '分享'}
      </button>

      {copied && (
        <span className="absolute -top-8 left-0 rounded-lg bg-emerald-500 px-2 py-1 text-xs text-white whitespace-nowrap">
          已复制到剪贴板
        </span>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[180px] z-50">
          <button onClick={handleWechat} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
            <MessageCircle size={14} className="text-emerald-500" />
            <div className="text-left">
              <p className="font-medium">微信发家人</p>
              <p className="text-slate-400">复制文字版到剪贴板</p>
            </div>
          </button>
          <button onClick={handleDoctor} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
            <ClipboardList size={14} className="text-blue-500" />
            <div className="text-left">
              <p className="font-medium">给医生看</p>
              <p className="text-slate-400">结构化摘要到剪贴板</p>
            </div>
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
            <Printer size={14} className="text-violet-500" />
            <div className="text-left">
              <p className="font-medium">打印完整记录</p>
              <p className="text-slate-400">浏览器打印对话全文</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
