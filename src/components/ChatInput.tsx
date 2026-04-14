import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { ImagePlus, Loader2, Mic, MicOff, Send, X } from 'lucide-react';
import type { ChatImageAttachment, SendMessageInput } from '../types';
import { AI_VISION_ENABLED } from '../lib/aiCapabilities';
import { SymptomDescriptionHelper } from './SymptomDescriptionHelper';
import { ModelSelector } from './ModelSelector';
import type { ModelTier } from '../lib/modelRouter';

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
  draftValue?: string;
  onDraftChange?: (value: string) => void;
  placeholderOverride?: string;
  selectedModeLabel?: string;
  selectedModeSummary?: string;
  onClearSelectedMode?: () => void;
  focusSignal?: number;
  /** When true, hide image upload and mode selector to reduce visual noise */
  isConsulting?: boolean;
  /** When true, diagnosis has been given — mode bar should be hidden or minimal */
  hasDiagnosis?: boolean;
  /** 'floating' (default) – fixed overlay used in active chat.
   *  'inline' – normal-flow card used on the home/welcome screen. */
  variant?: 'floating' | 'inline';
  messagesCount?: number;
  /** Currently active model tier for display */
  modelTier?: Exclude<ModelTier, 'auto'>;
  /** Reason the current model was selected */
  modelReason?: string;
  /** Called when user manually selects a model tier */
  onModelChange?: (tier: ModelTier) => void;
}

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
    return AI_VISION_ENABLED
      ? '支持文字、语音和最多 3 张图片；药盒、检查单图片会优先尝试识别可见文字。'
      : '支持文字与语音输入，可附图辅助描述。';
  }

  return AI_VISION_ENABLED
    ? `已附加 ${attachmentCount} 张图片，可先看图中异常或可读文字；建议继续补充部位、持续时间和伴随症状。`
    : `已附加 ${attachmentCount} 张图片（文件名已作为文字上下文）；请继续描述部位、持续时间和症状以便更准确分析。`;
}

function buildPlaceholder(attachmentCount: number, messagesCount?: number, hasDiagnosis?: boolean): string {
  if (attachmentCount === 0) {
    if (hasDiagnosis) return '继续提问，或开始新的问诊';
    if (messagesCount && messagesCount > 0) return '回答上面的问题，或补充新症状';
    return '描述症状，例如：孩子发烧38.5度';
  }

  return AI_VISION_ENABLED
    ? '可补充：哪里不适、持续多久、图里最担心哪一处，或想核对哪盒药 / 哪项指标…'
    : '请补充图片对应的部位、持续时间、是否疼/痒/发热，或你想核对的药名 / 指标…';
}

export function ChatInput({
  onSend,
  isLoading,
  withDesktopSidebar = false,
  desktopSidebarWidth = 256,
  onLayoutChange,
  draftValue,
  onDraftChange,
  placeholderOverride,
  selectedModeLabel,
  selectedModeSummary,
  onClearSelectedMode,
  focusSignal,
  variant = 'floating',
  isConsulting = false,
  hasDiagnosis = false,
  messagesCount,
  modelTier = 'pro',
  modelReason,
  onModelChange,
}: ChatInputProps) {
  const isInline = variant === 'inline';
  const [internalValue, setInternalValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<ChatImageAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(() => getKeyboardOffset());
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const value = draftValue ?? internalValue;

  const updateDraft = useCallback(
    (nextValue: string | ((previousValue: string) => string)) => {
      const resolved =
        typeof nextValue === 'function' ? nextValue(draftValue ?? internalValue) : nextValue

      if (draftValue === undefined) {
        setInternalValue(resolved)
      }
      onDraftChange?.(resolved)
    },
    [draftValue, internalValue, onDraftChange]
  )

  const attachmentCount = selectedAttachments.length;
  const remainingAttachmentSlots = Math.max(0, MAX_IMAGE_ATTACHMENTS - attachmentCount);
  const canSend = Boolean(value.trim() || attachmentCount > 0) && !isLoading;
  const helperText = isListening
    ? '语音输入中，点按麦克风即可结束。'
    : buildHelperText(attachmentCount);
  const placeholder = isListening
    ? '正在将语音实时转成文字…'
    : placeholderOverride || buildPlaceholder(attachmentCount, messagesCount, hasDiagnosis);

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

  useLayoutEffect(() => {
    notifyLayoutChange();
  }, [notifyLayoutChange, attachmentCount, isListening, isLoading, uploadError, value, selectedModeLabel]);

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

  useEffect(() => {
    if (focusSignal === undefined) return
    textareaRef.current?.focus({ preventScroll: true })
  }, [focusSignal])

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

    updateDraft('');
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
      setUploadError('当前浏览器不支持语音输入，请使用 Chrome / Safari，或直接输入文字描述。');
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
      updateDraft(transcript);
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
      setUploadError(
        AI_VISION_ENABLED
          ? `最多同时附加 ${MAX_IMAGE_ATTACHMENTS} 张图片——超过后单轮 token 用量会过大。请先移除不需要的图片。`
          : `最多同时附加 ${MAX_IMAGE_ATTACHMENTS} 张图片——图片文件信息会以文字形式加入提示词，超过后提示词会过长。请先移除不需要的图片。`
      );
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

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (!item.type.startsWith('image/')) continue;

        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        if (attachmentCount >= MAX_IMAGE_ATTACHMENTS) {
          setUploadError(`最多同时附加 ${MAX_IMAGE_ATTACHMENTS} 张图片，请先移除不需要的图片。`);
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          setUploadError('粘贴的图片超过 4MB，请压缩后重试。');
          return;
        }

        readFileAsDataUrl(file)
          .then((dataUrl) => {
            setSelectedAttachments((prev) => [
              ...prev,
              {
                id: `image-${Date.now()}`,
                kind: 'image',
                name: file.name || 'pasted-image.png',
                mimeType: file.type || 'image/png',
                sizeBytes: file.size,
                previewUrl: dataUrl,
                dataUrl,
              },
            ]);
            setUploadError('');
          })
          .catch(() => setUploadError('粘贴图片失败，请重试。'));
        return;
      }
    },
    [attachmentCount],
  );

  const containerStyle: CSSProperties & Record<'--desktop-sidebar-width', string> = isInline
    ? { '--desktop-sidebar-width': '0px' }
    : {
        bottom: `${keyboardOffset}px`,
        paddingBottom: keyboardOffset > 0 ? '12px' : 'max(12px, env(safe-area-inset-bottom))',
        '--desktop-sidebar-width': withDesktopSidebar ? `${desktopSidebarWidth}px` : '0px',
      };

  return (
    <div
      ref={containerRef}
      className={
        isInline
          ? 'w-full pt-2 pb-4'
          : `fixed left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/88 to-transparent px-3 pt-3 ${
              withDesktopSidebar ? 'lg:left-[var(--desktop-sidebar-width)]' : ''
            } sm:px-4`
      }
      style={containerStyle}
    >
      <div className={isInline ? 'w-full' : 'mx-auto max-w-2xl'}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
          disabled={isLoading || attachmentCount >= MAX_IMAGE_ATTACHMENTS}
        />

        <div
          className={
            isInline
              ? 'overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm'
              : 'overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-xl'
          }
        >
          {!isInline && <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />}

          <div className="px-3 pb-3 pt-3 sm:px-4">
            {uploadError && (
              <div
                className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-600"
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

            {selectedModeLabel && !isConsulting && !hasDiagnosis && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-700">
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-blue-700">
                  已选模式：{selectedModeLabel}
                </span>
                {selectedModeSummary && (
                  <p className="min-w-0 flex-1 leading-relaxed text-blue-700/90">{selectedModeSummary}</p>
                )}
                {onClearSelectedMode && (
                  <button
                    type="button"
                    onClick={onClearSelectedMode}
                    className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <X size={12} />
                    取消
                  </button>
                )}
              </div>
            )}

            {attachmentCount > 0 && (
              <div className="mb-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white px-3 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        已附加 {attachmentCount} 张图片
                      </p>
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {AI_VISION_ENABLED ? '图片将直接发送给视觉模型' : '图片以文字上下文方式辅助'}
                      </span>
                      {remainingAttachmentSlots > 0 && (
                        <span className="rounded-full border border-white/80 bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-500">
                          还可再加 {remainingAttachmentSlots} 张
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
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
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatFileSize(attachment.sizeBytes)}
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
                      onClick={() =>
                        updateDraft((previousValue) => appendPromptTemplate(previousValue, shortcut.template))
                      }
                      className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-blue-600"
                    >
                      {shortcut.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`rounded-3xl border px-2.5 py-2.5 transition-all duration-200 ${
                isInputFocused
                  ? isInline
                    ? 'border-blue-300 bg-white shadow-sm'
                    : 'border-blue-300 bg-white shadow-lg'
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
                    <span className="absolute -right-1 -top-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm">
                      {attachmentCount}
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => updateDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
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
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-500">
                      {helperText}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
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

                <ModelSelector
                  currentTier={modelTier}
                  currentReason={modelReason}
                  onChange={(tier) => onModelChange?.(tier)}
                />

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
                  className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>

            {!isInline && !hasDiagnosis && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <p className="text-xs text-slate-400 text-center">
                  仅供参考，不替代医生诊断或处方
                  {AI_VISION_ENABLED && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        onClick={() => setShowDisclaimer(d => !d)}
                        className="text-blue-500 hover:underline text-xs"
                      >
                        图片说明 ⓘ
                      </button>
                    </>
                  )}
                </p>
              </div>
            )}
            {showDisclaimer && !isInline && (
              <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 leading-relaxed">
                可上传最多3张图片用于辅助描述，不会仅凭图片下诊断。
                {AI_VISION_ENABLED ? ' 当前视觉模型已启用。' : ' 当前环境图片以文字形式辅助描述。'}
              </div>
            )}
          </div>
        </div>

        {messagesCount === 0 && !showHelper && (
          <button
            type="button"
            onClick={() => setShowHelper(true)}
            className="text-xs text-blue-500 hover:text-blue-600 mt-1"
          >
            不知怎么描述？点这里帮你说 →
          </button>
        )}

        {showHelper && (
          <SymptomDescriptionHelper
            onSubmit={(text) => {
              setShowHelper(false);
              onSend(text);
            }}
            onClose={() => setShowHelper(false)}
          />
        )}
      </div>
    </div>
  );
}
