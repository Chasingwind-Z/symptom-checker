import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, Loader2, Mic, MicOff, Send, ShieldAlert, X } from 'lucide-react';
import type { ChatImageAttachment, SendMessageInput } from '../types';

export interface ChatInputLayoutMetrics {
  height: number;
  keyboardOffset: number;
  isFocused: boolean;
}

interface ChatInputProps {
  onSend: (input: string | SendMessageInput) => void;
  isLoading: boolean;
  withDesktopSidebar?: boolean;
  onLayoutChange?: (layout: ChatInputLayoutMetrics) => void;
}

const MAX_IMAGE_SIZE_BYTES = 6 * 1024 * 1024;
const MIN_TEXTAREA_HEIGHT = 56;
const MAX_TEXTAREA_HEIGHT = 140;

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

function getKeyboardOffset(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const viewport = window.visualViewport;
  if (!viewport) {
    return 0;
  }

  return Math.round(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
}

export function ChatInput({
  onSend,
  isLoading,
  withDesktopSidebar = false,
  onLayoutChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatImageAttachment | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(() => getKeyboardOffset());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canSend = Boolean(value.trim() || selectedAttachment) && !isLoading;
  const helperText = isListening
    ? '语音输入中，点按麦克风即可结束。'
    : selectedAttachment
      ? '已附加 1 张图片，建议继续补充部位、持续时间和伴随症状。'
      : '支持文字、语音和 1 张图片辅助描述。';
  const placeholder = isListening
    ? '正在将语音实时转成文字…'
    : selectedAttachment
      ? '补充图片里哪里不适、持续多久、是否疼/痒/发热…'
      : '描述您的症状、持续时间，以及是否发热、疼痛或呼吸不适…';

  const notifyLayoutChange = useCallback(() => {
    if (!onLayoutChange || !containerRef.current) return;

    onLayoutChange({
      height: Math.ceil(containerRef.current.getBoundingClientRect().height),
      keyboardOffset,
      isFocused: isInputFocused,
    });
  }, [isInputFocused, keyboardOffset, onLayoutChange]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    const nextHeight = Math.min(
      MAX_TEXTAREA_HEIGHT,
      Math.max(MIN_TEXTAREA_HEIGHT, textarea.scrollHeight)
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, []);

  const updateKeyboardOffset = useCallback(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      setKeyboardOffset(0);
      return;
    }

    const nextOffset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    setKeyboardOffset(Math.round(nextOffset));
  }, []);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, value]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    viewport.addEventListener('resize', updateKeyboardOffset);
    viewport.addEventListener('scroll', updateKeyboardOffset);
    window.addEventListener('orientationchange', updateKeyboardOffset);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardOffset);
      viewport.removeEventListener('scroll', updateKeyboardOffset);
      window.removeEventListener('orientationchange', updateKeyboardOffset);
    };
  }, [updateKeyboardOffset]);

  useEffect(() => {
    notifyLayoutChange();
  }, [notifyLayoutChange, isListening, isLoading, selectedAttachment, uploadError, value]);

  useEffect(() => {
    if (!onLayoutChange || !containerRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    const element = containerRef.current;
    const observer = new ResizeObserver(() => notifyLayoutChange());

    observer.observe(element);

    return () => observer.disconnect();
  }, [notifyLayoutChange, onLayoutChange]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    []
  );

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

    const clearListeningState = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

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

    recognition.onend = clearListeningState;
    recognition.onerror = clearListeningState;

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
      ref={containerRef}
      className={`fixed left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/88 to-transparent px-3 pt-3 ${
        withDesktopSidebar ? 'lg:left-[320px]' : ''
      } sm:px-4`}
      style={{
        bottom: `${keyboardOffset}px`,
        paddingBottom: keyboardOffset > 0 ? '12px' : 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto max-w-2xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
          disabled={isLoading}
        />

        <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-[0_-16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          <div className="px-3 pb-3 pt-3 sm:px-4">
            {uploadError && (
              <div
                className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-600"
                role="alert"
              >
                {uploadError}
              </div>
            )}

            {isListening && (
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600"
                role="status"
                aria-live="polite"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                正在语音输入，点击麦克风即可结束
              </div>
            )}

            {selectedAttachment && (
              <div className="mb-3 rounded-[22px] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white px-3 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={selectedAttachment.previewUrl}
                      alt={selectedAttachment.name}
                      className="h-16 w-16 rounded-2xl border border-amber-100 bg-white object-cover"
                    />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 shadow-sm">
                      图片
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">已附加图片</p>
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        仅作辅助参考
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {selectedAttachment.name} · {formatFileSize(selectedAttachment.sizeBytes)}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                      建议再补充部位、持续时间、是否疼/痒/发热等文字信息；若伤口恶化、持续高热或呼吸困难，请及时线下就医。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAttachment(null)}
                    className="rounded-full border border-white/80 bg-white/90 p-1.5 text-slate-400 transition-colors hover:text-slate-700"
                    aria-label="移除图片"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div
              className={`rounded-[26px] border px-2.5 py-2.5 transition-all duration-200 ${
                isInputFocused
                  ? 'border-blue-300 bg-white shadow-[0_10px_30px_rgba(59,130,246,0.14)]'
                  : 'border-slate-200 bg-slate-50/90 shadow-sm'
              }`}
            >
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    selectedAttachment
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  title="上传皮疹、伤口、药盒或报告图片"
                  aria-label="上传图片"
                >
                  <ImagePlus size={18} />
                </button>

                <div className="min-w-0 flex-1">
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    disabled={isLoading}
                    placeholder={placeholder}
                    rows={1}
                    className="w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
                      maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
                    }}
                  />

                  <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
                    <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-slate-500">
                      {helperText}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
                        isListening ? 'bg-rose-50 text-rose-600' : 'bg-white text-slate-400'
                      }`}
                    >
                      {isListening ? (
                        '实时转写中'
                      ) : (
                        <>
                          Enter 发送<span className="hidden sm:inline"> · Shift+Enter 换行</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  aria-pressed={isListening}
                  title={isListening ? '结束语音输入' : '开始语音输入'}
                  aria-label={isListening ? '结束语音输入' : '开始语音输入'}
                  className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    isListening
                      ? 'border-rose-200 bg-rose-50 text-rose-600 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  aria-label="发送消息"
                  title="发送消息"
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-[0_10px_20px_rgba(59,130,246,0.28)] transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-start gap-2 rounded-2xl bg-slate-50/90 px-3 py-2.5 text-[11px] text-slate-500">
              <ShieldAlert size={12} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <p className="leading-relaxed">
                可上传 1 张皮疹、伤口、化验单或药盒照片作为辅助信息。当前版本会保存图片供后续视觉能力接入，但仍主要依据文字描述做谨慎分诊，不会仅凭图片下诊断。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
