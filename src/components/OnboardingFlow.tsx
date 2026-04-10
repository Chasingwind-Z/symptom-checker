import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Heart, Shield, Users } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type Role = 'self' | 'child' | 'elderly' | 'chronic';

const ROLES: { id: Role; emoji: string; label: string }[] = [
  { id: 'self', emoji: '👤', label: '我自己' },
  { id: 'child', emoji: '👶', label: '孩子' },
  { id: 'elderly', emoji: '🧓', label: '老人' },
  { id: 'chronic', emoji: '💊', label: '慢病家属' },
];

const ELDER_CONDITIONS = ['高血压', '糖尿病', '心脏病', '无'];
const CHRONIC_TYPES = ['高血压', '糖尿病', '冠心病', '其他'];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [childrenAges, setChildrenAges] = useState('');
  const [elderConditions, setElderConditions] = useState<string[]>([]);
  const [chronicTypes, setChronicTypes] = useState<string[]>([]);

  const toggleRole = useCallback((role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }, []);

  const toggleItem = useCallback((list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding.completed', 'true');
    localStorage.setItem('user.profile', JSON.stringify({
      roles: selectedRoles,
      children: childrenAges.split(/[,，、\s]+/).filter(Boolean),
      elderConditions,
      chronicTypes,
      completedAt: Date.now(),
    }));
    onComplete();
  }, [selectedRoles, childrenAges, elderConditions, chronicTypes, onComplete]);

  const needsStep3 = selectedRoles.some(r => r !== 'self');
  const canProceedStep2 = selectedRoles.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <StepCard key="step0" onNext={() => setStep(1)}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <Shield size={28} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">这不是看病的工具</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                这是帮你<strong>做决定</strong>的工具。<br />
                半夜孩子发烧、老人突然不舒服时，<br />
                <strong>30 秒告诉你严不严重、要不要今晚就去医院。</strong>
              </p>
            </div>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard key="step1" onNext={() => setStep(needsStep3 ? 2 : 3)} canProceed={canProceedStep2}>
            <div className="text-center mb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <Users size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">你主要在照顾谁？</h2>
              <p className="text-xs text-slate-500 mt-1">可多选，至少选一个</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                    selectedRoles.includes(role.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{role.emoji}</span>
                  <span className="text-sm font-medium text-slate-800">{role.label}</span>
                  {selectedRoles.includes(role.id) && <Check size={14} className="ml-auto text-blue-600" />}
                </button>
              ))}
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard key="step2" onNext={() => setStep(3)} canProceed={true}>
            <div className="text-center mb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <Heart size={28} className="text-violet-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">补充一点信息</h2>
              <p className="text-xs text-slate-500 mt-1">帮助给出更准确的建议</p>
            </div>
            <div className="space-y-4">
              {selectedRoles.includes('child') && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1.5">孩子几岁？</p>
                  <input
                    value={childrenAges}
                    onChange={e => setChildrenAges(e.target.value)}
                    placeholder="例如：3, 7（多个用逗号分隔）"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                  />
                </div>
              )}
              {selectedRoles.includes('elderly') && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1.5">老人有什么基础病？</p>
                  <div className="flex flex-wrap gap-2">
                    {ELDER_CONDITIONS.map(c => (
                      <button key={c} onClick={() => toggleItem(elderConditions, setElderConditions, c)}
                        className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                          elderConditions.includes(c) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>{c}</button>
                    ))}
                  </div>
                </div>
              )}
              {selectedRoles.includes('chronic') && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1.5">主要管理哪种慢病？</p>
                  <div className="flex flex-wrap gap-2">
                    {CHRONIC_TYPES.map(t => (
                      <button key={t} onClick={() => toggleItem(chronicTypes, setChronicTypes, t)}
                        className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                          chronicTypes.includes(t) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>{t}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard key="step3" onNext={handleComplete} nextLabel="开始使用">
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-lg font-bold text-slate-800">准备好了</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                下次家人不舒服时，打开这里，<br />
                30 秒帮你做出判断。
              </p>
            </div>
          </StepCard>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepCard({ children, onNext, canProceed = true, nextLabel = '下一步' }: {
  children: React.ReactNode;
  onNext: () => void;
  canProceed?: boolean;
  nextLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-2xl"
    >
      {children}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
          canProceed ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {nextLabel} <ArrowRight size={16} />
      </button>
    </motion.div>
  );
}
