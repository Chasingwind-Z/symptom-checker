import { useState, useMemo, useEffect } from 'react'
import type { ProfileDraft } from '../lib/healthData'
import type { WeatherData } from '../lib/geolocation'
import type { ConversationSession } from '../types'
import type { Population } from '../types'
import {
  MODE_TO_POPULATION,
  type ConsultationModeId,
} from '../lib/consultationModes'
import { generateSuggestions, generateExplanation } from '../services/suggestions/generator'
import { StatusStrip } from './StatusStrip'
import { PopulationTabs } from './PopulationTabs'
import { SuggestionCards } from './SuggestionCards'

interface WelcomeScreenProps {
  onApplyStarterText: (text: string) => void
  selectedModeId?: ConsultationModeId | null
  onSelectMode: (modeId: ConsultationModeId) => void
  profile?: ProfileDraft | null
  weather?: WeatherData | null
  weatherTemp?: string
  weatherCondition?: string
  pendingFollowUpCount?: number
  recentSessions: ConversationSession[]
  onOpenConversation: (sessionId: string) => void
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
  onApplyStarterText,
  selectedModeId,
  onSelectMode,
  profile,
  weather,
  weatherTemp,
  weatherCondition,
  pendingFollowUpCount = 0,
  recentSessions,
  onOpenConversation,
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
  useEffect(() => {
    window.setTimeout(() => {
      setSmartSuggestions(
        generateSuggestions({
          population: currentPopulation,
          hour: timeContext.hour,
          month: timeContext.month,
          recentQueries: [],
          userProfile,
        })
      );
    }, 0);
  }, [currentPopulation, timeContext, userProfile]);

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
  const weatherChipText = weatherTemp
    ? `${weatherTemp}°C ${weatherCondition || ''}`.trim()
    : (weather?.temp ? `${weather.temp} ${weather.text || ''}`.trim() : undefined);

  const recentConversationChips = recentSessions.slice(0, 4)
  const latestSession = recentSessions[0] ?? null
  const pendingFollowup = latestSession && (pendingFollowUpCount > 0 || wasUpdatedWithinOneDay(latestSession.updatedAt))
    ? { title: truncateText(getRecentSessionReference(latestSession) || latestSession.title, 24), sessionId: latestSession.id }
    : null;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Compact status strip */}
      <StatusStrip
        weatherText={weatherChipText}
        checkedIn={checkedInToday}
        pendingFollowUps={pendingFollowUpCount > 0 ? pendingFollowUpCount : undefined}
        locationText={locationCity || localCityLabel || undefined}
        onRetryLocation={onRetryLocation}
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
