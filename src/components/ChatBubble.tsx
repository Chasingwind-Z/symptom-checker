import { motion } from 'framer-motion';
import { User, Cross, Clock, BarChart2, HelpCircle, ClipboardList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onQuickReply?: (text: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/** Strip ```json ... ``` blocks, return only the prose before them */
function stripJsonBlock(content: string): string {
  return content.replace(/```json[\s\S]*?```/g, '').trim();
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

/** Generate quick-reply options based on question content */
function getQuickReplies(content: string): string[] {
  if (content.includes('多久') || content.includes('几天') || content.includes('持续') || content.includes('时间')) {
    return ['刚刚开始', '1天以内', '2-3天', '超过一周'];
  }
  if (content.includes('程度') || content.includes('严重') || content.includes('评分')) {
    return ['轻微，还好', '中等，有些难受', '比较严重', '非常严重'];
  }
  if (content.includes('年龄') || content.includes('多大')) {
    return ['18岁以下', '18-40岁', '40-60岁', '60岁以上'];
  }
  if (content.includes('基础疾病') || content.includes('慢性病') || content.includes('病史')) {
    return ['没有基础疾病', '高血压', '糖尿病', '心脏病'];
  }
  if (content.includes('伴随') || content.includes('其他症状')) {
    return ['没有其他症状', '有发烧', '有头痛', '有恶心'];
  }
  return [];
}

export function ChatBubble({ message, isStreaming, onQuickReply }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : stripJsonBlock(message.content);
  const hasJsonBlock = message.content.includes('```json');

  // Summary card: AI final reply that contains a JSON diagnosis block
  const isSummary = !isUser && hasJsonBlock && !isStreaming;
  // Question card: AI follow-up question (no JSON block)
  const useCardStyle = !isUser && !hasJsonBlock && isQuestion(message.content) && !isStreaming;
  const quickReplies = useCardStyle ? getQuickReplies(message.content) : [];

  if (isSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm border-l-4 border-l-emerald-400 px-4 py-3 max-w-[85%]">
          <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0 bg-emerald-50 rounded-full p-1.5 mt-0.5">
              <ClipboardList size={18} className="text-emerald-500" />
            </div>
            <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </div>
        </div>
        <span className="text-slate-400 text-xs mt-1 px-1 block">{formatTime(message.timestamp)}</span>
      </motion.div>
    );
  }

  if (useCardStyle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm border-l-4 border-l-blue-400 px-4 py-3 max-w-[85%]">
          <div className="flex items-start gap-2.5 mb-3">
            <div className="flex-shrink-0 bg-blue-50 rounded-full p-1.5 mt-0.5">
              {getQuestionIcon(displayContent)}
            </div>
            <div className="text-slate-700 text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </div>

          {quickReplies.length > 0 && onQuickReply && (
            <div className="flex flex-wrap gap-1.5 pl-9">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => onQuickReply(reply)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs px-3 py-1 rounded-full transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-slate-400 text-xs mt-1 px-1 block">{formatTime(message.timestamp)}</span>
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
        className="flex items-end gap-2 mb-4"
      >
        <div className="flex-shrink-0 rounded-full p-1.5 bg-blue-100">
          <Cross size={16} className="text-blue-500" />
        </div>
        <div className="max-w-[80%] flex flex-col items-start">
          <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm break-words prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5">
            <ReactMarkdown>{stripJsonBlock(displayContent)}</ReactMarkdown>
            <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
          </div>
          <span className="text-slate-400 text-xs mt-1 px-1">{formatTime(message.timestamp)}</span>
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
      className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
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
          className={`px-4 py-3 text-sm leading-relaxed break-words ${
            isUser
              ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm whitespace-pre-wrap'
              : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5'
          }`}
        >
          {isUser ? displayContent : <ReactMarkdown>{displayContent}</ReactMarkdown>}
        </div>
        <span className="text-slate-400 text-xs mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
