import { useState, useCallback, useMemo } from 'react';
import { ArrowRight, Clock3, MessageSquareText, Plus } from 'lucide-react';
import { getRiskPresentation } from '../lib/riskPresentation';
import { getFeedback, OUTCOME_BADGES } from '../lib/sessionFeedback';
import type { ConversationSession } from '../types';
import { ConversationMenu } from './ConversationMenu';

const RENAMED_SESSIONS_KEY = 'session_custom_titles';

function getRenamedTitles(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(RENAMED_SESSIONS_KEY) || '{}');
  } catch { return {}; }
}

function saveRenamedTitle(sessionId: string, title: string): void {
  const titles = getRenamedTitles();
  titles[sessionId] = title;
  localStorage.setItem(RENAMED_SESSIONS_KEY, JSON.stringify(titles));
}

interface ConversationHistoryPanelProps {
  sessions: ConversationSession[];
  activeSessionId?: string | null;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartNewSession?: () => void;
  title?: string;
  description?: string;
  emptyMessage?: string;
  maxItems?: number;
  variant?: 'default' | 'shelf' | 'sidebar';
  showStartButton?: boolean;
  startButtonLabel?: string;
}

function stripMetadata(content: string): string {
  return content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/\{"suggestions":\s*\[[\s\S]*?\]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPreviewText(session: ConversationSession): string {
  const lastAssistantMessage = [...session.messages]
    .reverse()
    .find((message) => message.role === 'assistant');
  const lastUserMessage = [...session.messages].reverse().find((message) => message.role === 'user');
  const source = stripMetadata(lastAssistantMessage?.content ?? lastUserMessage?.content ?? '');
  if (!source) return '继续补充症状后，系统会自动生成新的追问与判断。';
  return source.length > 72 ? `${source.slice(0, 72).trim()}…` : source;
}

function formatUpdatedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '刚刚更新';

  return parsed.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStorageLabel(storage: ConversationSession['storage']): string {
  return storage === 'supabase' ? '云端来源' : '浏览器保存';
}

export function ConversationHistoryPanel({
  sessions,
  activeSessionId,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
  title = '历史会话',
  description = '现在会按对话线程保存问诊历史，点开后可以直接继续聊，不再只是摘要卡片。',
  emptyMessage = '还没有历史会话。完成一次问诊后，这里会自动按“会话”保存，方便下次继续。',
  maxItems,
  variant = 'default',
  showStartButton = true,
  startButtonLabel = '新建对话',
}: ConversationHistoryPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [renameVersion, setRenameVersion] = useState(0);

  const renamedTitles = useMemo(() => getRenamedTitles(), [renameVersion]);

  const handleRenameSession = useCallback((id: string, title: string) => {
    saveRenamedTitle(id, title);
    setRenameVersion((v) => v + 1);
  }, []);

  const getDisplayTitle = useCallback(
    (session: ConversationSession) => renamedTitles[session.id] || session.title,
    [renamedTitles],
  );

  const visibleSessions =
    typeof maxItems === 'number' && maxItems > 0 ? sessions.slice(0, maxItems) : sessions;
  const hiddenCount = Math.max(0, sessions.length - visibleSessions.length);
  const isShelf = variant === 'shelf';
  const isSidebar = variant === 'sidebar';

  return (
    <section
      className={
        isSidebar
          ? 'flex h-full min-h-0 flex-col'
          : 'rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm'
      }
    >
      <div className={`flex items-start justify-between gap-3 flex-wrap ${isSidebar ? 'px-1' : ''}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <MessageSquareText size={16} className="text-cyan-600" />
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {hiddenCount > 0 && (isShelf || isSidebar) && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                +{hiddenCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
        {showStartButton && onStartNewSession && (
          <button
            type="button"
            onClick={onStartNewSession}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs text-cyan-700 hover:bg-cyan-100 transition-colors"
          >
            <Plus size={13} />
            {startButtonLabel}
          </button>
        )}
      </div>

      {visibleSessions.length === 0 ? (
        <div
          className={`mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 ${
            isSidebar ? 'text-xs text-slate-500' : 'text-sm text-slate-500'
          }`}
        >
          {emptyMessage}
        </div>
      ) : isSidebar ? (
        <>
          <div className="mt-3 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
            {visibleSessions.map((session) => {
              const riskMeta = getRiskPresentation(session.riskLevel ?? 'pending');
              const isActive = activeSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-lg cursor-pointer ${
                    isActive ? 'border-l-2 border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => onOpenSession(session.id)}
                >
                  {isActive && <div className="w-0.5 h-4 rounded-full bg-blue-500 shrink-0" />}

                  {editingId === session.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => {
                        if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                        setEditingId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                          setEditingId(null);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 rounded border border-blue-300 px-1.5 py-0.5 text-xs outline-none"
                    />
                  ) : (
                    <span className="flex-1 min-w-0 text-xs text-slate-700 truncate">
                      {getDisplayTitle(session)}
                    </span>
                  )}

                  <span className={`shrink-0 inline-block h-2 w-2 rounded-full ${riskMeta.tone.includes('red') || riskMeta.tone.includes('rose') ? 'bg-red-400' : riskMeta.tone.includes('amber') || riskMeta.tone.includes('yellow') ? 'bg-amber-400' : riskMeta.tone.includes('emerald') || riskMeta.tone.includes('green') ? 'bg-emerald-400' : 'bg-slate-300'}`} title={riskMeta.label} />

                  {(() => { const fb = getFeedback(session.id); return fb ? (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${OUTCOME_BADGES[fb.outcome].className}`}>{OUTCOME_BADGES[fb.outcome].label}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">待跟进</span>
                  ); })()}

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <ConversationMenu
                      onRename={() => { setEditingId(session.id); setEditTitle(getDisplayTitle(session)); }}
                      onDelete={() => {
                        if (window.confirm('确定删除这条记录？')) onDeleteSession?.(session.id);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {hiddenCount > 0 && (
            <p className="mt-3 px-1 text-xs text-slate-400">
              另外还有 {hiddenCount} 段较早对话，可在历史会话里继续查看。
            </p>
          )}
        </>
      ) : isShelf ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {visibleSessions.map((session) => {
            const riskMeta = getRiskPresentation(session.riskLevel ?? 'pending');
            const isActive = activeSessionId === session.id;

            return (
              <div key={session.id} className="group relative min-w-[260px] max-w-[300px] flex-1">
                <button
                  type="button"
                  onClick={() => onOpenSession(session.id)}
                  className={`h-full w-full rounded-2xl border px-4 py-3 pr-12 text-left transition-colors ${
                    isActive
                      ? 'border-cyan-300 bg-cyan-50/70'
                      : 'border-slate-200 bg-slate-50/80 hover:border-cyan-200 hover:bg-cyan-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {editingId === session.id ? (
                          <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => {
                              if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                                setEditingId(null);
                              }
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full rounded bg-white border border-blue-300 px-2 py-0.5 text-sm font-semibold text-slate-800 outline-none"
                          />
                        ) : (
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {getDisplayTitle(session)}
                          </p>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}
                        >
                          {riskMeta.label}
                        </span>
                        {(() => { const fb = getFeedback(session.id); return fb ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${OUTCOME_BADGES[fb.outcome].className}`}>{OUTCOME_BADGES[fb.outcome].label}</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">待跟进</span>
                        ); })()}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {getPreviewText(session)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} />
                        {formatUpdatedAt(session.updatedAt)}
                      </span>
                      <span>{session.messages.length} 条</span>
                      <span>{getStorageLabel(session.storage)}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-cyan-700">
                      打开
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </button>
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ConversationMenu
                    onRename={() => { setEditingId(session.id); setEditTitle(getDisplayTitle(session)); }}
                    onDelete={() => {
                      if (window.confirm('确定删除这条记录？')) onDeleteSession?.(session.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 gap-2.5">
            {visibleSessions.map((session) => {
              const riskMeta = getRiskPresentation(session.riskLevel ?? 'pending');
              const isActive = activeSessionId === session.id;

              return (
                <div key={session.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onOpenSession(session.id)}
                    className={`w-full rounded-2xl border px-4 py-3 pr-12 text-left transition-colors ${
                      isActive
                        ? 'border-cyan-300 bg-cyan-50/70'
                        : 'border-slate-200 bg-slate-50/70 hover:border-cyan-200 hover:bg-cyan-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingId === session.id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => {
                                if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                                setEditingId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editTitle.trim()) handleRenameSession(session.id, editTitle.trim());
                                  setEditingId(null);
                                }
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full rounded bg-white border border-blue-300 px-2 py-0.5 text-sm font-semibold text-slate-800 outline-none"
                            />
                          ) : (
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {getDisplayTitle(session)}
                            </p>
                          )}
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${riskMeta.tone}`}
                          >
                            {riskMeta.label}
                          </span>
                          {(() => { const fb = getFeedback(session.id); return fb ? (
                            <span className={`rounded-full px-2 py-0.5 text-xs ${OUTCOME_BADGES[fb.outcome].className}`}>{OUTCOME_BADGES[fb.outcome].label}</span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">待跟进</span>
                          ); })()}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {getPreviewText(session)}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={12} />
                            {formatUpdatedAt(session.updatedAt)}
                          </span>
                          <span>{session.messages.length} 条消息</span>
                          <span>{getStorageLabel(session.storage)}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-cyan-700">
                        继续
                        <ArrowRight size={13} />
                      </span>
                    </div>
                  </button>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ConversationMenu
                      onRename={() => { setEditingId(session.id); setEditTitle(getDisplayTitle(session)); }}
                      onDelete={() => {
                        if (window.confirm('确定删除这条记录？')) onDeleteSession?.(session.id);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {hiddenCount > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              另外还有 {hiddenCount} 段较早对话，历史会按最近更新时间自动排序。
            </p>
          )}
        </>
      )}
    </section>
  );
}
