import { Heart, Thermometer, Brain, Baby } from 'lucide-react';
import { SymptomTags } from './SymptomTags';
import { CommunityStats } from './CommunityStats';

interface WelcomeScreenProps {
  onSend: (text: string) => void;
}

const SCENARIOS = [
  {
    label: '发烧了不知道严不严重',
    sendText: '我发烧了，不知道严不严重',
    icon: Thermometer,
  },
  {
    label: '头痛持续三天要去医院吗',
    sendText: '我头痛已经持续三天了',
    icon: Brain,
  },
  {
    label: '孩子咳嗽该去哪里看',
    sendText: '我的孩子一直在咳嗽',
    icon: Baby,
  },
] as const;

export function WelcomeScreen({ onSend }: WelcomeScreenProps) {
  return (
    <div className="max-w-lg mx-auto w-full flex flex-col items-center pt-10 pb-6 px-2">
      {/* Logo 区 */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-50 rounded-2xl p-4 mb-4">
          <Heart size={40} className="text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">健康助手</h1>
        <p className="text-slate-500 text-sm text-center leading-relaxed">
          AI 驱动的智能分诊，帮您判断是否需要就医
        </p>
      </div>

      {/* 社区数据 */}
      <div className="w-full mb-6">
        <CommunityStats />
      </div>

      {/* 示例场景卡片 */}
      <div className="w-full grid grid-cols-3 gap-3 mb-6">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => onSend(s.sendText)}
              className="bg-white border border-slate-200 rounded-2xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Icon size={18} className="text-blue-400 mb-2" />
              <p className="text-slate-700 text-xs font-medium leading-snug">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* 快捷症状标签 */}
      <SymptomTags onSelect={onSend} />
    </div>
  );
}
