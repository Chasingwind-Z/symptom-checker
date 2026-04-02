import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音输入，请使用 Chrome 或 Safari');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current = null;
      }
    };

    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="max-w-2xl mx-auto flex gap-3 items-end">
        <div className="flex-1 relative flex items-end">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`absolute left-3 bottom-3 transition-colors ${
              isListening
                ? 'text-red-500 animate-pulse'
                : 'text-slate-400 hover:text-blue-500 cursor-pointer'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={isListening ? '正在聆听...' : '描述您的症状…（Enter 发送，Shift+Enter 换行）'}
            rows={1}
            className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 text-sm resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 shadow-sm"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 transition-colors flex-shrink-0 shadow-sm"
        >
          {isLoading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
