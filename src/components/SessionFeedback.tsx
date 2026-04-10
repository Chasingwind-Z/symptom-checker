import { useState, useCallback } from 'react';
import { Check, Eye, Heart, MessageCircle } from 'lucide-react';

type Outcome = 'visited_hospital' | 'observing' | 'recovered' | 'other';

interface SessionFeedbackProps {
  sessionId: string;
  onFeedback: (sessionId: string, outcome: Outcome, note?: string) => void;
}

const OPTIONS: { id: Outcome; icon: React.ReactNode; label: string }[] = [
  { id: 'visited_hospital', icon: <Check size={14} />, label: '已去医院' },
  { id: 'observing', icon: <Eye size={14} />, label: '在家观察' },
  { id: 'recovered', icon: <Heart size={14} />, label: '已好转' },
];

export function SessionFeedback({ sessionId, onFeedback }: SessionFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [otherNote, setOtherNote] = useState('');

  const handleSelect = useCallback((outcome: Outcome) => {
    onFeedback(sessionId, outcome);
    setSubmitted(true);
  }, [sessionId, onFeedback]);

  const handleOtherSubmit = useCallback(() => {
    onFeedback(sessionId, 'other', otherNote);
    setSubmitted(true);
  }, [sessionId, onFeedback, otherNote]);

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 mt-3">
        <Check size={14} className="text-emerald-500" />
        <p className="text-xs text-slate-500">谢谢反馈，已记录</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-400 mb-2">这次建议对你有帮助吗？</p>
      <div className="flex items-center gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            {opt.icon} {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowOther(!showOther)}
          className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          title="其他反馈"
        >
          <MessageCircle size={14} />
        </button>
      </div>
      {showOther && (
        <div className="mt-2 flex gap-2">
          <input
            value={otherNote}
            onChange={e => setOtherNote(e.target.value)}
            placeholder="补充说明..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
          />
          <button
            onClick={handleOtherSubmit}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
          >
            提交
          </button>
        </div>
      )}
    </div>
  );
}
