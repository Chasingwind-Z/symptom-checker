const FEEDBACK_KEY = 'session_feedbacks';

export type SessionOutcome = 'visited_hospital' | 'observing' | 'recovered' | 'other';

export interface SessionFeedbackData {
  sessionId: string;
  outcome: SessionOutcome;
  outcomeNote?: string;
  feedbackAt: number;
}

export function saveFeedback(data: SessionFeedbackData): void {
  try {
    const all = getAllFeedbacks();
    all.push(data);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all.slice(-100)));
  } catch {}
}

export function getAllFeedbacks(): SessionFeedbackData[] {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
  } catch { return []; }
}

export function getFeedback(sessionId: string): SessionFeedbackData | undefined {
  return getAllFeedbacks().find(f => f.sessionId === sessionId);
}

export function hasGivenFeedback(sessionId: string): boolean {
  return getAllFeedbacks().some(f => f.sessionId === sessionId);
}

export function cleanOldPendingFollowups(): number {
  try {
    const feedbacks = getAllFeedbacks();
    const existingIds = new Set(feedbacks.map(f => f.sessionId));

    const sessionsRaw = localStorage.getItem('conversation_sessions');
    if (!sessionsRaw) return 0;

    const sessions = JSON.parse(sessionsRaw);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const session of sessions) {
      if (!existingIds.has(session.id)) {
        const sessionTime = new Date(session.createdAt || session.updatedAt).getTime();
        if (sessionTime < sevenDaysAgo) {
          saveFeedback({
            sessionId: session.id,
            outcome: 'other',
            outcomeNote: '超过7天未反馈，自动归档',
            feedbackAt: Date.now(),
          });
          cleaned++;
        }
      }
    }
    return cleaned;
  } catch { return 0; }
}

export const OUTCOME_BADGES: Record<SessionOutcome, { label: string; className: string }> = {
  visited_hospital: { label: '已就诊', className: 'bg-blue-50 text-blue-700' },
  observing: { label: '观察中', className: 'bg-amber-50 text-amber-700' },
  recovered: { label: '已好转', className: 'bg-emerald-50 text-emerald-700' },
  other: { label: '已反馈', className: 'bg-slate-100 text-slate-600' },
};
