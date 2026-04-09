import { motion } from 'framer-motion';
import { User, Cross, Clock, BarChart2, HelpCircle, ClipboardList, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { ChatDensityPreference } from '../lib/experienceSettings';
import { AI_VISION_ENABLED } from '../lib/aiCapabilities';
import { useGuardianTheme } from '../hooks/useGuardianTheme';
import { buildJDSearchUrl, trackMedicationClick } from '../lib/jdAffiliate';
import type { Message } from '../types';
import { AgentOrchestrationPanel } from './AgentOrchestrationPanel';
import { ToolCallIndicator } from './ToolCallIndicator';

const DRUG_KEYWORDS_FOR_JD: Record<string, string> = {
  '对乙酰氨基酚': '对乙酰氨基酚 OTC',
  '布洛芬': '布洛芬 OTC',
  '氯雷他定': '氯雷他定 抗过敏',
  '蒙脱石散': '蒙脱石散',
  '口服补液盐': '口服补液盐 电解质',
  '维生素C': '维生素C',
  '炉甘石': '炉甘石洗剂',
  '感冒灵': '感冒灵颗粒',
  '连花清瘟': '连花清瘟',
  '藿香正气': '藿香正气水',
  '止痛贴': '止痛贴 外用',
  '退烧药': '退烧药 OTC',
  '感冒药': '感冒药 OTC',
};

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onQuickReply?: (text: string) => void;
  diagnosisResult?: boolean;
  density?: ChatDensityPreference;
  assistantMessageIndex?: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/** Strip ```json ... ``` blocks and {"suggestions": [...]} from display */
function stripJsonBlock(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```json[\s\S]*$/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*$/g, '')
    .trim();
}

/** Detect if the AI turn is a follow-up question (has ? and no JSON block) */
function isQuestion(content: string): boolean {
  return content.includes('？') || content.includes('?');
}

/** Pick an icon based on keywords */
function getQuestionIcon(content: string) {
  if (content.includes('时间') || content.includes('多久') || content.includes('几天') || content.includes('持续')) {
    return <Clock size={18} className="text-blue-500" />;
  }
  if (content.includes('程度') || content.includes('严重') || content.includes('评分') || content.includes('多严重')) {
    return <BarChart2 size={18} className="text-blue-500" />;
  }
  return <HelpCircle size={18} className="text-blue-500" />;
}

const assistantMarkdownAllowedElements = [
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'li',
  'ol',
  'p',
  'pre',
  'strong',
  'ul',
] as const;

const assistantMarkdownComponents: Components = {
  a({ href, children }) {
    const safeHref =
      typeof href === 'string' && /^(https?:|mailto:|tel:)/i.test(href)
        ? href
        : undefined;

    if (!safeHref) {
      return <span className="font-medium text-slate-700">{children}</span>;
    }

    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noreferrer"
        className="break-all font-medium text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-700"
      >
        {children}
      </a>
    );
  },
  p({ children }) {
    return <p className="my-2 whitespace-pre-wrap leading-7 text-slate-700 first:mt-0 last:mb-0">{children}</p>;
  },
  h1({ children }) {
    return <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-900 first:mt-0">{children}</h3>;
  },
  h2({ children }) {
    return <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-900 first:mt-0">{children}</h3>;
  },
  h3({ children }) {
    return <h4 className="mt-3 mb-1 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>;
  },
  h4({ children }) {
    return <h4 className="mt-3 mb-1 text-sm font-semibold text-slate-900 first:mt-0">{children}</h4>;
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1.5 pl-5 marker:text-slate-400">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1.5 pl-5 marker:text-slate-400">{children}</ol>;
  },
  li({ children }) {
    return <li className="pl-1 whitespace-pre-wrap leading-7 text-slate-700">{children}</li>;
  },
  strong({ children }) {
    return <strong className="font-semibold text-slate-900">{children}</strong>;
  },
  em({ children }) {
    return <em className="font-medium text-slate-700">{children}</em>;
  },
  blockquote({ children }) {
    return <blockquote className="my-2 border-l-2 border-slate-200 pl-3 text-slate-600">{children}</blockquote>;
  },
  pre({ children }) {
    return (
      <pre className="my-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 text-[13px] leading-6 text-slate-100">
        {children}
      </pre>
    );
  },
  code({ children, className, ...props }) {
    const content = String(children).replace(/\n$/, '');
    const isBlock = Boolean(className) || content.includes('\n');

    return (
      <code
        {...props}
        className={
          isBlock
            ? `font-mono text-[13px] text-slate-100 ${className ?? ''}`.trim()
            : 'rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-700'
        }
      >
        {content}
      </code>
    );
  },
};

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        skipHtml
        unwrapDisallowed
        allowedElements={assistantMarkdownAllowedElements}
        components={assistantMarkdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function useAnimatedStreamingText(content: string, isStreaming: boolean): string {
  const [displayed, setDisplayed] = useState(isStreaming ? '' : content);
  const displayedRef = useRef(displayed);

  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    if (!isStreaming) {
      displayedRef.current = content;
      return;
    }

    let timeoutId: number | undefined;

    const tick = () => {
      const current = displayedRef.current;

      if (!content) {
        displayedRef.current = '';
        setDisplayed('');
        return;
      }

      if (!content.startsWith(current)) {
        displayedRef.current = '';
        setDisplayed('');
        timeoutId = window.setTimeout(tick, 14);
        return;
      }

      if (current.length >= content.length) {
        return;
      }

      const remaining = content.length - current.length;
      const step = remaining > 120 ? 18 : remaining > 64 ? 10 : remaining > 24 ? 6 : 3;
      const next = content.slice(0, current.length + step);

      displayedRef.current = next;
      setDisplayed(next);
      timeoutId = window.setTimeout(tick, 18);
    };

    timeoutId = window.setTimeout(tick, 12);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [content, isStreaming]);

  return isStreaming ? displayed : content;
}

export function ChatBubble({
  message,
  isStreaming,
  onQuickReply,
  diagnosisResult,
  density = 'comfortable',
  assistantMessageIndex,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const guardianTheme = useGuardianTheme();
  const isElderlyMode = guardianTheme.id === 'elderly';
  const displayContent = isUser ? message.content : stripJsonBlock(message.content);
  const animatedStreamingContent = useAnimatedStreamingText(displayContent, Boolean(!isUser && isStreaming));
  const hasJsonBlock = message.content.includes('```json');
  // During active consultation (no diagnosis yet), hide decorations on non-diagnosis bubbles
  const isQuestionPhase = !isUser && !hasJsonBlock && !diagnosisResult;
  const attachmentGallery =
    message.attachments && message.attachments.length > 0 ? (
      <div className="mt-3 space-y-2">
        {message.attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`overflow-hidden rounded-xl border ${
              isUser ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-slate-50'
            }`}
          >
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.name}
                className="max-h-52 w-full object-cover"
              />
            ) : (
              <div
                className={`flex min-h-28 items-center justify-center px-4 py-5 text-center ${
                  isUser ? 'bg-white/5 text-blue-50/90' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon size={18} className="opacity-80" />
                  <p className="text-xs font-medium">
                    {AI_VISION_ENABLED ? '图片已发送给视觉模型' : '图片文件名已包含在分析上下文中'}
                  </p>
                  <p className="text-xs leading-relaxed opacity-80">
                    为避免浏览器缓存超限，刷新后只保留文件名，不再展示完整预览。
                  </p>
                </div>
              </div>
            )}
            <div
              className={`flex items-center gap-2 px-3 py-2 text-xs ${
                isUser ? 'text-blue-50/90' : 'text-slate-500'
              }`}
            >
              <ImageIcon size={12} className="flex-shrink-0" />
              <span className="truncate">{attachment.name}</span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 ${
                  isUser
                    ? 'bg-white/10 text-blue-50'
                    : 'border border-slate-200 bg-white text-slate-500'
                }`}
              >
                {attachment.previewUrl
                  ? AI_VISION_ENABLED
                    ? '已发送给视觉模型'
                    : '辅助文字分析'
                  : AI_VISION_ENABLED
                    ? '已发送（预览已省略）'
                    : '辅助分析（预览已省略）'}
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : null;
  // Hide agent orchestration info from end users — only show on diagnosis conclusion bubbles
  const agentSummary =
    !isUser && !isQuestionPhase && hasJsonBlock && message.agentRoute ? (
      <div className="mb-2">
        <AgentOrchestrationPanel route={message.agentRoute} compact />
      </div>
    ) : null;
  const toolCallSummary =
    !isUser && !isQuestionPhase && message.toolCalls && message.toolCalls.length > 0 ? (
      <div className="mb-2">
        <ToolCallIndicator toolCalls={message.toolCalls} compact />
      </div>
    ) : null;

  // Summary card: AI final reply that contains a JSON diagnosis block
  const isSummary = !isUser && hasJsonBlock && !isStreaming;
  // Question card: AI follow-up question (has ? or has suggestions)
  const hasSuggestions = !isUser && message.suggestions && message.suggestions.length > 0;
  const useCardStyle = !isUser && !hasJsonBlock && !isStreaming &&
    (isQuestion(message.content) || hasSuggestions);
  const hasAssistantCopy = !isUser && animatedStreamingContent.length > 0;

  const detectedDrugs = useMemo(() => {
    if (message.role !== 'assistant') return [];
    const content = message.content;
    const matches: { name: string; searchKey: string }[] = [];
    for (const [drug, searchKey] of Object.entries(DRUG_KEYWORDS_FOR_JD)) {
      if (content.includes(drug)) {
        matches.push({ name: drug, searchKey });
      }
    }
    return matches.slice(0, 3);
  }, [message.content, message.role]);

  const drugChips = detectedDrugs.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span className="text-xs text-slate-400 mr-1 self-center">相关药品：</span>
      {detectedDrugs.map((drug) => (
        <button
          key={drug.name}
          onClick={() => {
            trackMedicationClick({
              medicationName: drug.name,
              source: 'chat_bubble',
            });
            window.open(buildJDSearchUrl(drug.searchKey), '_blank', 'noopener');
          }}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <ShoppingCart size={11} />
          {drug.name}
        </button>
      ))}
    </div>
  ) : null;

  const handleQuickReply = (suggestion: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onQuickReply?.(suggestion);
  };

  const bubbleSpacingClass = density === 'compact' ? 'mb-3' : 'mb-4';
  const bubblePaddingClass = density === 'compact' ? 'px-3 py-2.5' : 'px-4 py-3';
  const bubbleTextClass = isElderlyMode
    ? 'text-base leading-relaxed'
    : density === 'compact' ? 'text-[13px] leading-6' : 'text-sm leading-relaxed';
  const innerGapClass = density === 'compact' ? 'gap-2' : 'gap-2.5';
  const timestampMarginClass = density === 'compact' ? 'mt-0.5' : 'mt-1';
  const suggestionMarginClass = density === 'compact' ? 'mt-2.5' : 'mt-3';
  const suggestionButtonClass = isElderlyMode
    ? 'px-5 py-3 text-base'
    : density === 'compact' ? 'px-3 py-1.5 text-[13px]' : 'px-3.5 py-2 text-sm';

  if (isSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={bubbleSpacingClass}
      >
        <div
          className={`max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 border-l-4 border-l-emerald-400 bg-white shadow-sm ${bubblePaddingClass}`}
        >
          <div className={`flex items-start ${innerGapClass}`}>
            <div className="flex-shrink-0 bg-emerald-50 rounded-full p-1.5 mt-0.5">
              <ClipboardList size={18} className="text-emerald-500" />
            </div>
            <div className={`text-slate-700 ${bubbleTextClass}`}>
              {agentSummary}
              {toolCallSummary}
              <AssistantMarkdown content={displayContent} />
              {attachmentGallery}
              {drugChips}
            </div>
          </div>
        </div>
        <span className={`block px-1 text-xs text-slate-400 ${timestampMarginClass}`}>
          {formatTime(message.timestamp)}
        </span>
      </motion.div>
    );
  }

  if (useCardStyle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={bubbleSpacingClass}
      >
        <div
          className={`max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 border-l-4 border-l-blue-400 bg-white shadow-sm ${bubblePaddingClass}`}
        >
          <div className={`mb-3 flex items-start ${innerGapClass}`}>
            <div className="flex-shrink-0 bg-blue-50 rounded-full p-1.5 mt-0.5">
              {getQuestionIcon(displayContent)}
            </div>
            <div className={`text-slate-700 ${bubbleTextClass}`}>
              {isQuestionPhase && assistantMessageIndex != null && assistantMessageIndex > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all ${
                        i <= assistantMessageIndex ? 'w-5 bg-blue-400' : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">
                    {assistantMessageIndex < 3 ? `还有约${3 - assistantMessageIndex}个问题` : '即将给出建议'}
                  </span>
                </div>
              )}
              {agentSummary}
              {toolCallSummary}
              <AssistantMarkdown content={displayContent} />
              {attachmentGallery}
            </div>
          </div>

          {hasSuggestions && onQuickReply && !diagnosisResult && (
            <div className={`flex flex-wrap gap-2 pl-9 ${suggestionMarginClass}`}>
              {message.suggestions!.map((suggestion, i) => (
                <motion.button
                  key={`${suggestion}-${i}`}
                  type="button"
                  onClick={() => handleQuickReply(suggestion)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`cursor-pointer rounded-full border border-blue-200/90 bg-gradient-to-b from-white to-blue-50 font-medium text-blue-700 shadow-sm transition-[border-color,box-shadow,background-color] hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2 ${suggestionButtonClass}`}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          )}

          {drugChips && <div className={`pl-9 ${suggestionMarginClass}`}>{drugChips}</div>}
        </div>
        {!isQuestionPhase && (
        <span className={`block px-1 text-xs text-slate-400 ${timestampMarginClass}`}>
          {formatTime(message.timestamp)}
        </span>
        )}
      </motion.div>
    );
  }

  // Streaming AI bubble (partial content, no card style yet)
  if (!isUser && isStreaming) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-end gap-2 ${bubbleSpacingClass}`}
      >
        <div className="flex-shrink-0 rounded-full p-1.5 bg-blue-100">
          <Cross size={16} className="text-blue-500" />
        </div>
        <div className="max-w-[80%] flex flex-col items-start">
          <div
            className={`break-words rounded-2xl rounded-tl-sm border border-blue-100 border-l-4 border-l-blue-300 bg-gradient-to-b from-white to-blue-50/60 text-slate-700 shadow-md ${bubblePaddingClass} ${bubbleTextClass}`}
          >
            {agentSummary}
            {toolCallSummary}
            {hasAssistantCopy ? <AssistantMarkdown content={animatedStreamingContent} /> : null}
            {attachmentGallery}
            <div
              className={`flex items-center gap-2 text-xs font-medium text-slate-400 ${
                hasAssistantCopy || attachmentGallery ? 'mt-3' : ''
              }`}
            >
              <span>正在整理回复</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-blue-300"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -1, 0] }}
                    transition={{
                      duration: 1.15,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                      delay: dot * 0.16,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {!isQuestionPhase && (
          <span className={`px-1 text-xs text-slate-400 ${timestampMarginClass}`}>
            {formatTime(message.timestamp)}
          </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Default bubble
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-2 ${bubbleSpacingClass} ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className={`flex-shrink-0 rounded-full p-1.5 ${
          isUser ? 'bg-blue-500' : 'bg-blue-100'
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Cross size={16} className="text-blue-500" />
        )}
      </div>

      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`break-words ${bubblePaddingClass} ${bubbleTextClass} ${
            isUser
              ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm whitespace-pre-wrap'
              : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm'
            }`}
        >
          {!isUser && agentSummary}
          {!isUser && toolCallSummary}
          {isUser ? displayContent : <AssistantMarkdown content={displayContent} />}
          {attachmentGallery}
          {!isUser && drugChips}
        </div>
        {!(isQuestionPhase) && (
        <span className={`px-1 text-xs text-slate-400 ${timestampMarginClass}`}>
          {formatTime(message.timestamp)}
        </span>
        )}
      </div>
    </motion.div>
  );
}
