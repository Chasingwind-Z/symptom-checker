import {
  type CSSProperties,
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
  desktopSidebarWidth?: number;
  onLayoutChange?: (layout: ChatInputLayoutMetrics) => void;
}

const VISION_INPUT_ENABLED = /^(1|true|yes)$/i.test(
  String(import.meta.env.VITE_AI_SUPPORTS_VISION ?? 'false')
);
const MAX_IMAGE_ATTACHMENTS = 3;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const MIN_TEXTAREA_HEIGHT = 56;
const MAX_TEXTAREA_HEIGHT = 140;
const IMAGE_PROMPT_SHORTCUTS = [
  {
    id: 'symptom-context',
    label: '补部位 / 多久',
    template: '部位：\n持续时间：\n是否疼 / 痒 / 发热：',
  },
  {
    id: 'medication-box',
    label: '核对药盒',
    template: '请帮我先核对药盒上的通用名、剂量和禁忌；我目前还在用：',
  },
  {
    id: 'report-highlights',
    label: '解释报告',
    template: '请先说明图片里最需要关注的异常或可读指标，并告诉我哪些情况需要尽快线下复查：',
  },
] as const;

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

function appendPromptTemplate(currentValue: string, template: string): string {
  const normalizedTemplate = template.trim();
  if (!normalizedTemplate) return currentValue;
  if (!currentValue.trim()) return normalizedTemplate;
  if (currentValue.includes(normalizedTemplate)) return currentValue;
  return `${currentValue.trimEnd()}\n${normalizedTemplate}`;
}

function buildHelperText(attachmentCount: number): string {
  if (attachmentCount === 0) {
    return VISION_INPUT_ENABLED
      ? '支持文字、语音和最多 3 张图片；药盒、检查单图片会优先尝试识别可见文字。'
      : '支持文字、语音和最多 3 张图片；当前环境仍以文字判断为主。';
  }

  return VISION_INPUT_ENABLED
    ? `已附加 ${attachmentCount} 张图片，可先看图中异常或可读文字；建议继续补充部位、持续时间和伴随症状。`
    : `已附加 ${attachmentCount} 张图片；当前未启用视觉模型，建议继续补充部位、持续时间和伴随症状。`;
}

function buildPlaceholder(attachmentCount: number): string {
  if (attachmentCount === 0) {
    return '描述您的症状、持续时间，以及是否发热、疼痛或呼吸不适…';
  }

  return VISION_INPUT_ENABLED
    ? '可补充：哪里不适、持续多久、图里最担心哪一处，或想核对哪盒药 / 哪项指标…'
    : '请补充图片对应的部位、持续时间、是否疼/痒/发热，或你想核对的药名 / 指标…';
}

export function ChatInput({
  onSend,
  isLoading,
  withDesktopSidebar = false,
  desktopSidebarWidth = 320,
  onLayoutChange,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<ChatImageAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(() => getKeyboardOffset());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const attachmentCount = selectedAttachments.length;
  const remainingAttachmentSlots = Math.max(0, MAX_IMAGE_ATTACHMENTS - attachmentCount);
  const canSend = Boolean(value.trim() || attachmentCount > 0) && !isLoading;
  const helperText = isListening
    ? '语音输入中，点按麦克风即可结束。'
    : buildHelperText(attachmentCount);
  const placeholder = isListening
    ? '正在将语音实时转成文字…'
    : buildPlaceholder(attachmentCount);

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
  }, [notifyLayoutChange, attachmentCount, isListening, isLoading, uploadError, value]);

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
    if ((!trimmed && attachmentCount === 0) || isLoading) return;

    if (attachmentCount > 0) {
      onSend({
        text: trimmed,
        attachments: selectedAttachments,
      });
    } else {
      onSend(trimmed);
    }

    setValue('');
    setSelectedAttachments([]);
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

    if (attachmentCount >= MAX_IMAGE_ATTACHMENTS) {
      setUploadError(`最多上传 ${MAX_IMAGE_ATTACHMENTS} 张图片，请先移除不需要的图片。`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('请上传 JPG、PNG 或 WebP 图片。');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError('单张图片请控制在 4MB 以内，优先上传清晰近景，便于更快完成图像辅助分析。');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedAttachments((previousAttachments) => [
        ...previousAttachments,
        {
          id: `image-${Date.now()}`,
          kind: 'image',
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          sizeBytes: file.size,
          previewUrl: dataUrl,
          dataUrl,
        },
      ]);
      setUploadError('');
    } catch {
      setUploadError('图片读取失败，请换一张再试。');
    }
  };

  const containerStyle: CSSProperties & Record<'--desktop-sidebar-width', string> = {
    bottom: `${keyboardOffset}px`,
    paddingBottom: keyboardOffset > 0 ? '12px' : 'max(12px, env(safe-area-inset-bottom))',
    '--desktop-sidebar-width': withDesktopSidebar ? `${desktopSidebarWidth}px` : '0px',
  };

  return (
    <div
      ref={containerRef}
      className={`fixed left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/88 to-transparent px-3 pt-3 ${
        withDesktopSidebar ? 'lg:left-[var(--desktop-sidebar-width)]' : ''
      } sm:px-4`}
      style={containerStyle}
    >
      <div className="mx-auto max-w-2xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
          disabled={isLoading || attachmentCount >= MAX_IMAGE_ATTACHMENTS}
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

            {attachmentCount > 0 && (
              <div className="mb-3 rounded-[22px] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white px-3 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        已附加 {attachmentCount} 张图片
                      </p>
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        {VISION_INPUT_ENABLED ? '图片辅助分析已启用' : '仍以文字判断为主'}
                      </span>
                      {remainingAttachmentSlots > 0 && (
                        <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          还可再加 {remainingAttachmentSlots} 张
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                      建议再补充部位、持续时间、是否疼 / 痒 / 发热；若是药盒或报告，可直接说明想核对的药名、剂量或指标。
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative overflow-hidden rounded-2xl border border-amber-100 bg-white"
                    >
                      <img
                        src={attachment.previewUrl}
                        alt={attachment.name}
                        className="h-24 w-full bg-slate-100 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttachments((previousAttachments) =>
                            previousAttachments.filter(
                              (previousAttachment) => previousAttachment.id !== attachment.id
                            )
                          );
                          setUploadError('');
                        }}
                        className="absolute right-2 top-2 rounded-full border border-white/80 bg-white/90 p-1 text-slate-400 transition-colors hover:text-slate-700"
                        aria-label={`移除图片 ${attachment.name}`}
                      >
                        <X size={14} />
                      </button>
                      <div className="px-2.5 py-2">
                        <p className="truncate text-xs font-medium text-slate-700">{attachment.name}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {formatFileSize(attachment.sizeBytes)} · 仅作辅助参考
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {IMAGE_PROMPT_SHORTCUTS.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => setValue((previousValue) => appendPromptTemplate(previousValue, shortcut.template))}
                      className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:text-blue-600"
                    >
                      {shortcut.label}
                    </button>
                  ))}
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
                  disabled={isLoading || attachmentCount >= MAX_IMAGE_ATTACHMENTS}
                  className={`relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    attachmentCount > 0
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  title={
                    attachmentCount >= MAX_IMAGE_ATTACHMENTS
                      ? `已达 ${MAX_IMAGE_ATTACHMENTS} 张上限，请先移除不需要的图片`
                      : `上传皮疹、伤口、药盒或报告图片（最多 ${MAX_IMAGE_ATTACHMENTS} 张）`
                  }
                  aria-label={
                    attachmentCount >= MAX_IMAGE_ATTACHMENTS
                      ? `已达到图片上限 ${MAX_IMAGE_ATTACHMENTS} 张`
                      : `上传图片，当前已选 ${attachmentCount} 张`
                  }
                >
                  <ImagePlus size={18} />
                  {attachmentCount > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      {attachmentCount}
                    </span>
                  )}
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
                可上传最多 3 张皮疹、伤口、化验单或药盒照片作为辅助信息。
                {VISION_INPUT_ENABLED
                  ? ' 当前模型若支持视觉，会先参考图片里可见的异常或文字，再结合你的文字做谨慎分诊。'
                  : ' 当前环境未启用真实视觉模型，系统会把图片当作辅助背景，引导你补充更关键的文字信息。'}
                不会仅凭图片下诊断，完整图片预览主要保留在当前会话中。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
