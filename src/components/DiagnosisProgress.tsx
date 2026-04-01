import { CheckCircle2 } from 'lucide-react';
import type { DiagnosisResult, Message } from '../types';

interface DiagnosisProgressProps {
  messages: Message[];
  diagnosisResult: DiagnosisResult | null;
}

const STEPS = [
  { label: '描述症状', color: 'blue' },
  { label: '详细评估', color: 'blue' },
  { label: '获取建议', color: 'green' },
] as const;

export function DiagnosisProgress({ messages, diagnosisResult }: DiagnosisProgressProps) {
  const userCount = messages.filter((m) => m.role === 'user').length;
  const assistantCount = messages.filter((m) => m.role === 'assistant').length;

  // step 0 active: ≥1 user message
  // step 1 active: ≥1 assistant message
  // step 2 active: diagnosisResult exists
  const step0 = userCount >= 1;
  const step1 = assistantCount >= 1;
  const step2 = diagnosisResult !== null;

  if (!step0) return null;

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-3">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between relative">
          {/* connector lines */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex px-[20px]">
            <div className={`flex-1 h-0.5 transition-colors duration-500 ${step1 ? 'bg-blue-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-0.5 transition-colors duration-500 ${step2 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          </div>

          {/* Step 0 — 描述症状 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step0 ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
            }`}>
              {step0 && <CheckCircle2 size={16} className="text-white" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${step0 ? 'text-slate-700' : 'text-slate-300'}`}>
              {STEPS[0].label}
            </span>
          </div>

          {/* Step 1 — 详细评估 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step1 ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
            }`}>
              {step1 && <CheckCircle2 size={16} className="text-white" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${step1 ? 'text-slate-700' : 'text-slate-300'}`}>
              {STEPS[1].label}
            </span>
          </div>

          {/* Step 2 — 获取建议 */}
          <div className="flex flex-col items-center gap-1.5 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
              step2 ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-200'
            }`}>
              {step2 && <CheckCircle2 size={16} className="text-white" />}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${step2 ? 'text-slate-700' : 'text-slate-300'}`}>
              {STEPS[2].label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
