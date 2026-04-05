import { motion } from 'framer-motion';
import { User, Cross, Clock, BarChart2, HelpCircle, ClipboardList, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import { AgentOrchestrationPanel } from './AgentOrchestrationPanel';
import { ToolCallIndicator } from './ToolCallIndicator';

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onQuickReply?: (text: string) => void;
  diagnosisResult?: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/** Strip ```json ... ``` blocks and {"suggestions": [...]} from display */
function stripJsonBlock(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
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

export function ChatBubble({ message, isStreaming, onQuickReply, diagnosisResult }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const displayContent = isUser ? message.content : stripJsonBlock(message.content);
  const hasJsonBlock = message.content.includes('```json');
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
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="max-h-52 w-full object-cover"
            />
            <div
              className={`flex items-center gap-2 px-3 py-2 text-[11px] ${
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
                仅作辅助参考
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : null;
  const agentSummary =
    !isUser && message.agentRoute ? (
      <div className="mb-2">
        <AgentOrchestrationPanel route={message.agentRoute} compact />
      </div>
    ) : null;
  const toolCallSummary =
    !isUser && message.toolCalls && message.toolCalls.length > 0 ? (
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
              {agentSummary}
              {toolCallSummary}
              <ReactMarkdown>{displayContent}</ReactMarkdown>
              {attachmentGallery}
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
              {agentSummary}
              {toolCallSummary}
              <ReactMarkdown>{displayContent}</ReactMarkdown>
              {attachmentGallery}
            </div>
          </div>

          {hasSuggestions && onQuickReply && !diagnosisResult && (
            <div className="flex flex-wrap gap-2 mt-3 pl-9">
              {message.suggestions!.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => onQuickReply(suggestion)}
                  className="text-sm px-3 py-1.5 rounded-full border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  {suggestion}
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
            {agentSummary}
            <ReactMarkdown>{stripJsonBlock(displayContent)}</ReactMarkdown>
            {attachmentGallery}
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
            {!isUser && agentSummary}
            {!isUser && toolCallSummary}
            {isUser ? displayContent : <ReactMarkdown>{displayContent}</ReactMarkdown>}
            {attachmentGallery}
          </div>
        <span className="text-slate-400 text-xs mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
