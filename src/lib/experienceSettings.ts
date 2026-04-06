export type DesktopSidebarMode = 'expanded' | 'collapsed';
export type LocationPreference = 'device' | 'profile' | 'none';
export type OfficialSourcePreference = 'balanced' | 'official-first' | 'brief';
export type ChatDensityPreference = 'comfortable' | 'compact';

export interface ExperienceSettings {
  desktopSidebarMode: DesktopSidebarMode;
  locationPreference: LocationPreference;
  officialSourcePreference: OfficialSourcePreference;
  chatDensity: ChatDensityPreference;
}

export const DEFAULT_EXPERIENCE_SETTINGS: ExperienceSettings = {
  desktopSidebarMode: 'collapsed',
  locationPreference: 'device',
  officialSourcePreference: 'balanced',
  chatDensity: 'comfortable',
};

const STORAGE_KEY = 'symptom_experience_settings_v1';
const DESKTOP_SIDEBAR_MODES = ['expanded', 'collapsed'] as const;
const LOCATION_PREFERENCES = ['device', 'profile', 'none'] as const;
const OFFICIAL_SOURCE_PREFERENCES = ['balanced', 'official-first', 'brief'] as const;
const CHAT_DENSITIES = ['comfortable', 'compact'] as const;

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T);
}

export function loadExperienceSettings(): ExperienceSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_EXPERIENCE_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_EXPERIENCE_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof ExperienceSettings, unknown>>;

    return {
      desktopSidebarMode: isOneOf(parsed.desktopSidebarMode, DESKTOP_SIDEBAR_MODES)
        ? parsed.desktopSidebarMode
        : DEFAULT_EXPERIENCE_SETTINGS.desktopSidebarMode,
      locationPreference: isOneOf(parsed.locationPreference, LOCATION_PREFERENCES)
        ? parsed.locationPreference
        : DEFAULT_EXPERIENCE_SETTINGS.locationPreference,
      officialSourcePreference: isOneOf(
        parsed.officialSourcePreference,
        OFFICIAL_SOURCE_PREFERENCES
      )
        ? parsed.officialSourcePreference
        : DEFAULT_EXPERIENCE_SETTINGS.officialSourcePreference,
      chatDensity: isOneOf(parsed.chatDensity, CHAT_DENSITIES)
        ? parsed.chatDensity
        : DEFAULT_EXPERIENCE_SETTINGS.chatDensity,
    };
  } catch {
    return DEFAULT_EXPERIENCE_SETTINGS;
  }
}

export function saveExperienceSettings(settings: ExperienceSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage write failures and keep using the in-memory settings for this session.
  }
}
