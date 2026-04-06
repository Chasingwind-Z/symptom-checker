import { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Send, Loader2, Mic, MicOff, ImagePlus, ShieldAlert, X } from 'lucide-react';
import type { ChatImageAttachment, SendMessageInput } from '../types';

interface ChatInputProps {
  onSend: (input: string | SendMessageInput) => void;
  isLoading: boolean;
  withDesktopSidebar?: boolean;
}

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface BrowserWindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
}

function formatFileSize(sizeBytes: number): string {
  const sizeInMb = sizeBytes / (1024 * 1024);
  return sizeInMb >= 1
    ? `${sizeInMb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('图片读取失败'));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}

export function ChatInput({
  onSend,
  isLoading,
  withDesktopSidebar = false,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatImageAttachment | null>(null);
  const [uploadError, setUploadError] = useState('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && !selectedAttachment) || isLoading) return;

    if (selectedAttachment) {
      onSend({
        text: trimmed,
        attachments: [selectedAttachment],
      });
    } else {
      onSend(trimmed);
    }

    setValue('');
    setSelectedAttachment(null);
    setUploadError('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startListening = () => {
    const speechWindow = window as BrowserWindowWithSpeechRecognition;
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音输入，请使用 Chrome 或 Safari');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
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

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('请上传 JPG、PNG 或 WebP 图片。');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError('图片请控制在 6MB 以内，便于快速上传与后续视觉模型接入。');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedAttachment({
        id: `image-${Date.now()}`,
        kind: 'image',
        name: file.name,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        previewUrl: dataUrl,
        dataUrl,
      });
      setUploadError('');
    } catch {
      setUploadError('图片读取失败，请换一张再试。');
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 ${
        withDesktopSidebar ? 'lg:left-[320px]' : ''
      }`}
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-2xl mx-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
          disabled={isLoading}
        />

        {selectedAttachment && (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 shadow-sm">
            <div className="flex items-start gap-3">
              <img
                src={selectedAttachment.previewUrl}
                alt={selectedAttachment.name}
                className="h-16 w-16 rounded-xl object-cover border border-amber-100"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">已附加图片</p>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    仅作辅助参考
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 truncate">
                  {selectedAttachment.name} · {formatFileSize(selectedAttachment.sizeBytes)}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  建议再补充部位、持续时间、是否疼/痒/发热等文字信息；若伤口恶化、持续高热或呼吸困难，请及时线下就医。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttachment(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-700 transition-colors"
                aria-label="移除图片"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`rounded-2xl border p-3 shadow-sm transition-colors ${
              selectedAttachment
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="上传皮疹、伤口、药盒或报告图片"
          >
            <ImagePlus size={18} />
          </button>

          <div className="flex-1 relative flex items-end">
            <button
              type="button"
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
              placeholder={
                isListening
                  ? '正在聆听...'
                  : '描述您的症状，或补充图片里是哪里不适…（Enter 发送，Shift+Enter 换行）'
              }
              rows={1}
              className="w-full bg-white border border-slate-200 text-slate-800 placeholder-slate-400 rounded-2xl pl-10 pr-4 py-3 text-sm resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 shadow-sm"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || (!value.trim() && !selectedAttachment)}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl p-3 transition-colors flex-shrink-0 shadow-sm"
          >
            {isLoading ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Send size={18} className="text-white" />
            )}
          </button>
        </div>
        <div className="mt-2 flex items-start gap-1.5 px-1 text-[11px] text-slate-500">
          <ShieldAlert size={12} className="mt-0.5 text-amber-500 flex-shrink-0" />
          <p className="leading-relaxed">
            可上传 1 张皮疹、伤口、化验单或药盒照片作为辅助信息。当前版本会保存图片供后续视觉能力接入，但仍主要依据文字描述做谨慎分诊，不会仅凭图片下诊断。
          </p>
        </div>
        {uploadError && <p className="mt-2 px-1 text-[11px] text-rose-500">{uploadError}</p>}
      </div>
    </div>
  );
}
