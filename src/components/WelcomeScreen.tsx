import { useState, useMemo } from 'react'
import type { CaseHistoryItem, ProfileDraft } from '../lib/healthData'
import type { WeatherData } from '../lib/geolocation'
import type { ConversationSession } from '../types'
import type { Population } from '../types'
import {
  MODE_TO_POPULATION,
  type ConsultationModeId,
} from '../lib/consultationModes'
import type { HouseholdProfileRecord } from '../lib/healthWorkspaceInsights'
import { buildWeatherExperienceSummary } from '../lib/weatherExperience'
import { generateSuggestions, generateExplanation } from '../services/suggestions/generator'
import { StatusStrip } from './StatusStrip'
import { PopulationTabs } from './PopulationTabs'
import { SuggestionCards } from './SuggestionCards'

interface WelcomeScreenProps {
  onStartConsultation: () => void
  onApplyStarterText: (text: string) => void
  selectedModeId?: ConsultationModeId | null
  onSelectMode: (modeId: ConsultationModeId) => void
  onToggleMap: () => void
  onOpenEpidemicDashboard?: () => void
  sessionEmail?: string | null
  profile?: ProfileDraft | null
  weather?: WeatherData | null
  pendingFollowUpCount?: number
  householdProfiles?: HouseholdProfileRecord[]
  switchingHouseholdProfileId?: string | null
  recentCases?: CaseHistoryItem[]
  recentSessions: ConversationSession[]
  onOpenConversation: (sessionId: string) => void
  onSelectHouseholdProfile: (record: HouseholdProfileRecord) => void
  onManageProfiles: () => void
  locationCity?: string
  onRetryLocation?: () => void
}

const DEFAULT_PROFILE_CITY = '中国大陆'

const POPULATION_TO_MODE: Record<Population, ConsultationModeId> = {
  self: 'self',
  pediatric: 'child',
  geriatric: 'elderly',
  chronic: 'chronic',
}

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text
}

function getRecentSessionReference(session: ConversationSession) {
  const firstUserMessage = session.messages.find((message) => message.role === 'user')
  return normalizeText(firstUserMessage?.content ?? session.title)
}

function wasUpdatedWithinOneDay(value: string) {
  const updatedAt = new Date(value)
  if (Number.isNaN(updatedAt.getTime())) return false
  return Date.now() - updatedAt.getTime() <= 24 * 60 * 60 * 1000
}


export function WelcomeScreen({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStartConsultation: _onStartConsultation,
  onApplyStarterText,
  selectedModeId,
  onSelectMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleMap: _onToggleMap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenEpidemicDashboard: _onOpenEpidemicDashboard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionEmail: _sessionEmail,
  profile,
  weather,
  pendingFollowUpCount = 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  householdProfiles: _householdProfiles = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  switchingHouseholdProfileId: _switchingHouseholdProfileId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recentCases: _recentCases = [],
  recentSessions,
  onOpenConversation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectHouseholdProfile: _onSelectHouseholdProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onManageProfiles: _onManageProfiles,
  locationCity,
  onRetryLocation,
}: WelcomeScreenProps) {
  const [checkedInToday] = useState(() => {
    try {
      const raw = localStorage.getItem('daily_checkins');
      if (!raw) return false;
      const checkins = JSON.parse(raw) as Array<{ date: string }>;
      const today = new Date().toISOString().slice(0, 10);
      return checkins.some(c => c.date === today);
    } catch { return false; }
  });

  const [userProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user.profile') || '{}'); }
    catch { return {}; }
  });

  const [timeContext] = useState(() => {
    const now = new Date();
    return { hour: now.getHours(), month: now.getMonth() + 1 };
  });

  const currentPopulation = MODE_TO_POPULATION[selectedModeId || 'self'] || 'self';

  const [smartSuggestions, setSmartSuggestions] = useState(() =>
    generateSuggestions({
      population: currentPopulation,
      hour: timeContext.hour,
      month: timeContext.month,
      recentQueries: [],
      userProfile,
    })
  );

  // Re-generate when population changes
  const [prevPopulation, setPrevPopulation] = useState(currentPopulation);
  if (prevPopulation !== currentPopulation) {
    setPrevPopulation(currentPopulation);
    setSmartSuggestions(
      generateSuggestions({
        population: currentPopulation,
        hour: timeContext.hour,
        month: timeContext.month,
        recentQueries: [],
        userProfile,
      })
    );
  }

  const explanation = useMemo(() => generateExplanation({
    population: currentPopulation,
    hour: timeContext.hour,
    month: timeContext.month,
    recentQueries: [],
    userProfile,
  }), [currentPopulation, timeContext, userProfile]);

  const normalizedProfileCity = normalizeText(profile?.city)
  const localCityLabel =
    normalizedProfileCity && normalizedProfileCity !== DEFAULT_PROFILE_CITY ? normalizedProfileCity : ''
  const weatherSummary = buildWeatherExperienceSummary(weather ?? null)
  const recentConversationChips = recentSessions.slice(0, 4)
  const latestSession = recentSessions[0] ?? null
  const pendingFollowup = latestSession && (pendingFollowUpCount > 0 || wasUpdatedWithinOneDay(latestSession.updatedAt))
    ? { title: truncateText(getRecentSessionReference(latestSession) || latestSession.title, 24), sessionId: latestSession.id }
    : null;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Compact status strip */}
      <StatusStrip
        weatherText={weather ? `${weather.temp} ${weather.text}` : (weatherSummary?.tags?.[0] || '天气加载中')}
        checkedIn={checkedInToday}
        pendingFollowUps={pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined}
        locationText={locationCity || localCityLabel || undefined}
        onRetryLocation={onRetryLocation}
        onOpenMap={_onToggleMap}
      />

      {/* Compact header */}
      <div className="text-center pt-1">
        <h1 className="text-lg sm:text-xl font-bold text-slate-800">现在谁不舒服？</h1>
        <p className="text-xs text-slate-500 mt-0.5">30秒告诉你严不严重、要不要去医院</p>
      </div>

      {/* Population tabs — horizontal filter */}
      <PopulationTabs
        value={currentPopulation}
        onChange={(p) => {
          const modeId = POPULATION_TO_MODE[p] || 'self';
          onSelectMode(modeId);
        }}
      />

      {/* Smart suggestion cards — hero section */}
      <div className="mt-1 sm:mt-3">
        <SuggestionCards
          suggestions={smartSuggestions}
          onSelect={(query) => {
            onApplyStarterText(query);
          }}
          pendingFollowup={pendingFollowup}
          onOpenFollowup={(sessionId) => onOpenConversation(sessionId)}
          explanation={explanation}
        />
      </div>

      {/* Recent session chips */}
      {recentConversationChips.length > 0 && (
        <div className="flex gap-2 mt-1.5 sm:mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {recentConversationChips.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onOpenConversation(session.id)}
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {truncateText(getRecentSessionReference(session) || session.title, 16)}
            </button>
          ))}
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-2 sm:h-4" />
    </div>
  )
}
