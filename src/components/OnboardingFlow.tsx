import { useCallback, useEffect, useRef, useState } from 'react'

interface OnboardingFlowProps {
  onComplete: () => void
}

type GuardianModeId = 'self' | 'child' | 'elderly' | 'chronic'

interface GuardianMode {
  id: GuardianModeId
  icon: string
  title: string
  description: string
}

const GUARDIAN_MODES: GuardianMode[] = [
  { id: 'self', icon: '🧑', title: '本人', description: '为自己问诊' },
  { id: 'child', icon: '👶', title: '儿童守护', description: '儿科问题优先' },
  { id: 'elderly', icon: '🛡️', title: '老人守护', description: '高风险优先排查' },
  { id: 'chronic', icon: '💗', title: '慢病守护', description: '基础病叠加评估' },
]

const AGE_RANGES = ['18岁以下', '18-40岁', '40-60岁', '60岁以上'] as const

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [animating, setAnimating] = useState(false)

  const [selectedMode, setSelectedMode] = useState<GuardianModeId | null>(null)
  const [selectedAge, setSelectedAge] = useState<string | null>(null)
  const [allergy, setAllergy] = useState('')
  const [medications, setMedications] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 'forward' : 'backward')
    setAnimating(true)
    const timeoutId = window.setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 200)
    return () => window.clearTimeout(timeoutId)
  }, [step])

  // Save guardian mode when advancing from step 1
  const handleGuardianContinue = useCallback(() => {
    if (selectedMode) {
      localStorage.setItem('selected_guardian_mode', selectedMode)
      goTo(2)
    }
  }, [selectedMode, goTo])

  // Save profile and advance
  const handleProfileSave = useCallback(() => {
    const profile = {
      ageRange: selectedAge,
      allergy: allergy.trim() || null,
      medications: medications.trim() || null,
    }
    localStorage.setItem('onboarding_profile', JSON.stringify(profile))
    goTo(3)
  }, [selectedAge, allergy, medications, goTo])

  const handleProfileSkip = useCallback(() => {
    goTo(3)
  }, [goTo])

  // Prevent body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const transitionClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div
        ref={containerRef}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center"
      >
        <div
          className={`w-full transition-all duration-200 ease-in-out ${transitionClass}`}
        >
          {step === 0 && <StepWelcome onNext={() => goTo(1)} />}
          {step === 1 && (
            <StepGuardian
              modes={GUARDIAN_MODES}
              selected={selectedMode}
              onSelect={setSelectedMode}
              onContinue={handleGuardianContinue}
            />
          )}
          {step === 2 && (
            <StepProfile
              selectedAge={selectedAge}
              onSelectAge={setSelectedAge}
              allergy={allergy}
              onAllergyChange={setAllergy}
              medications={medications}
              onMedicationsChange={setMedications}
              onSave={handleProfileSave}
              onSkip={handleProfileSkip}
            />
          )}
          {step === 3 && <StepReady onStart={onComplete} />}
        </div>

        {/* Step dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i === step ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 1: Welcome ─── */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-[64px] leading-none mb-4">💊</span>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">健康助手</h1>
      <p className="text-slate-500 mb-8">AI 帮您判断症状是否需要就医</p>
      <button
        onClick={onNext}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
      >
        开始了解 →
      </button>
    </div>
  )
}

/* ─── Step 2: Guardian Mode ─── */

function StepGuardian({
  modes,
  selected,
  onSelect,
  onContinue,
}: {
  modes: GuardianMode[]
  selected: GuardianModeId | null
  onSelect: (id: GuardianModeId) => void
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-bold text-slate-800 mb-5">您今天是为谁问诊？</h2>
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-150 ${
              selected === mode.id
                ? 'border-blue-400 bg-blue-50 shadow-md'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <span className="text-2xl mb-1">{mode.icon}</span>
            <span className="font-semibold text-sm text-slate-700">{mode.title}</span>
            <span className="text-xs text-slate-400 mt-0.5">{mode.description}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onContinue}
        disabled={!selected}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-40 disabled:cursor-not-allowed"
      >
        继续
      </button>
    </div>
  )
}

/* ─── Step 3: Health Profile ─── */

function StepProfile({
  selectedAge,
  onSelectAge,
  allergy,
  onAllergyChange,
  medications,
  onMedicationsChange,
  onSave,
  onSkip,
}: {
  selectedAge: string | null
  onSelectAge: (v: string) => void
  allergy: string
  onAllergyChange: (v: string) => void
  medications: string
  onMedicationsChange: (v: string) => void
  onSave: () => void
  onSkip: () => void
}) {
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        填写基础信息，AI 给出更准确的建议
      </h2>

      {/* Age range */}
      <div className="w-full mb-4">
        <p className="text-sm text-slate-500 mb-2">年龄段</p>
        <div className="grid grid-cols-2 gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => onSelectAge(range)}
              className={`py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                selectedAge === range
                  ? 'bg-blue-500 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Allergy */}
      <div className="w-full mb-3">
        <p className="text-sm text-slate-500 mb-1">过敏史（可跳过）</p>
        <input
          type="text"
          value={allergy}
          onChange={(e) => onAllergyChange(e.target.value)}
          placeholder="如：青霉素过敏"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Current medications */}
      <div className="w-full mb-5">
        <p className="text-sm text-slate-500 mb-1">当前用药（可跳过）</p>
        <input
          type="text"
          value={medications}
          onChange={(e) => onMedicationsChange(e.target.value)}
          placeholder="如：降压药、二甲双胍"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium hover:bg-slate-50 transition-colors"
        >
          跳过
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          保存并继续
        </button>
      </div>
    </div>
  )
}

/* ─── Step 4: Ready ─── */

function StepReady({ onStart }: { onStart: () => void }) {
  const features = [
    { icon: '🩺', text: '描述症状，AI 多轮追问' },
    { icon: '📋', text: '给出就医建议和报告' },
    { icon: '💊', text: '推荐用药，检查安全性' },
  ]

  return (
    <div className="flex flex-col items-center w-full text-center">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">准备好了！</h2>
      <div className="w-full space-y-3 mb-8">
        {features.map((f) => (
          <div
            key={f.text}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50"
          >
            <span className="text-2xl">{f.icon}</span>
            <span className="text-sm font-medium text-slate-700">{f.text}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onStart}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-shadow"
      >
        开始问诊
      </button>
    </div>
  )
}
