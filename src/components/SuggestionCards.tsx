import { Thermometer, HeartPulse, Pill, Brain, Stethoscope, AlertCircle, Activity } from 'lucide-react';
import type { Population } from '../types';

interface SuggestionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  query: string;
}

const SUGGESTIONS: Record<Population, SuggestionCard[]> = {
  self: [
    { icon: <Brain size={20} className="text-blue-500" />, title: '突然头痛是怎么回事', description: '判断是否需要就医', query: '突然头痛，想知道严不严重' },
    { icon: <Thermometer size={20} className="text-amber-500" />, title: '感冒一周还没好', description: '评估是否需要换药或就诊', query: '感冒一周了还没好，需要去医院吗' },
    { icon: <Activity size={20} className="text-violet-500" />, title: '失眠两周影响生活', description: '了解可能原因和应对', query: '连续失眠两周了，白天很疲惫' },
    { icon: <Stethoscope size={20} className="text-emerald-500" />, title: '胃痛反复发作', description: '判断是否需要检查', query: '胃痛反复发作，不确定要不要去查' },
  ],
  pediatric: [
    { icon: <Thermometer size={20} className="text-red-500" />, title: '孩子发烧38.5℃', description: '要不要去急诊', query: '孩子发烧38.5度，需要去急诊吗' },
    { icon: <AlertCircle size={20} className="text-amber-500" />, title: '宝宝咳嗽半夜加重', description: '判断严重程度', query: '宝宝咳嗽，半夜特别厉害' },
    { icon: <Activity size={20} className="text-blue-500" />, title: '小孩拉肚子三次了', description: '需要注意什么', query: '小孩今天拉肚子三次了' },
    { icon: <Brain size={20} className="text-violet-500" />, title: '孩子摔到头怎么办', description: '紧急判断指南', query: '孩子摔倒碰到头了，需要去医院吗' },
  ],
  geriatric: [
    { icon: <HeartPulse size={20} className="text-red-500" />, title: '老人胸闷气短', description: '评估紧急程度', query: '家里老人说胸闷气短' },
    { icon: <Brain size={20} className="text-amber-500" />, title: '突然说话不清楚', description: '可能是中风信号', query: '老人突然说话不太清楚了' },
    { icon: <Activity size={20} className="text-blue-500" />, title: '饭后头晕', description: '判断原因', query: '老人每次吃完饭就头晕' },
    { icon: <AlertCircle size={20} className="text-violet-500" />, title: '夜里起来腿软', description: '需要注意什么', query: '老人半夜起来腿发软站不稳' },
  ],
  chronic: [
    { icon: <HeartPulse size={20} className="text-red-500" />, title: '血压突然160怎么办', description: '紧急处理建议', query: '血压突然升到160了怎么办' },
    { icon: <Pill size={20} className="text-amber-500" />, title: '血糖空腹8.2', description: '需要调药吗', query: '空腹血糖8.2，需要调整用药吗' },
    { icon: <AlertCircle size={20} className="text-blue-500" />, title: '降压药漏吃一次', description: '补吃还是跳过', query: '降压药忘记吃了一次，要补吃吗' },
    { icon: <Brain size={20} className="text-violet-500" />, title: '头晕和药有关系吗', description: '药物副作用判断', query: '最近头晕，不知道和吃的药有没有关系' },
  ],
};

interface SuggestionCardsProps {
  population: Population;
  onSelect: (query: string) => void;
}

export function SuggestionCards({ population, onSelect }: SuggestionCardsProps) {
  const cards = SUGGESTIONS[population] || SUGGESTIONS.self;

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => onSelect(card.query)}
          className="group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all"
        >
          <div className="mb-2">{card.icon}</div>
          <p className="text-sm font-semibold text-slate-800 leading-snug">{card.title}</p>
          <p className="text-xs text-slate-400 mt-1">{card.description}</p>
        </button>
      ))}
    </div>
  );
}
