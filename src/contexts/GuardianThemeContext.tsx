import { createContext, useMemo, type ReactNode } from 'react'

export interface GuardianTheme {
  id: string
  primary: string
  bubble: string
  header: string
  accent: string
  fontSize: string
  label: string
}

const GUARDIAN_THEMES: Record<string, GuardianTheme> = {
  self: {
    id: 'self',
    primary: 'blue',
    bubble: 'bg-blue-500',
    header: 'bg-blue-50',
    accent: 'text-blue-600',
    fontSize: 'text-sm',
    label: '本人',
  },
  child: {
    id: 'child',
    primary: 'green',
    bubble: 'bg-emerald-500',
    header: 'bg-emerald-50',
    accent: 'text-emerald-600',
    fontSize: 'text-sm',
    label: '儿童守护',
  },
  elderly: {
    id: 'elderly',
    primary: 'orange',
    bubble: 'bg-orange-500',
    header: 'bg-orange-50',
    accent: 'text-orange-600',
    fontSize: 'text-lg',
    label: '老人守护',
  },
  chronic: {
    id: 'chronic',
    primary: 'purple',
    bubble: 'bg-purple-500',
    header: 'bg-purple-50',
    accent: 'text-purple-600',
    fontSize: 'text-sm',
    label: '慢病守护',
  },
}

const DEFAULT_THEME = GUARDIAN_THEMES.self

// eslint-disable-next-line react-refresh/only-export-components
export const GuardianThemeContext = createContext<GuardianTheme>(DEFAULT_THEME)

// eslint-disable-next-line react-refresh/only-export-components
export function getGuardianTheme(modeId: string | null | undefined): GuardianTheme {
  if (!modeId) return DEFAULT_THEME
  return GUARDIAN_THEMES[modeId] ?? DEFAULT_THEME
}

interface Props {
  modeId: string | null | undefined
  children: ReactNode
}

export function GuardianThemeProvider({ modeId, children }: Props) {
  const theme = useMemo(() => getGuardianTheme(modeId), [modeId])
  return (
    <GuardianThemeContext.Provider value={theme}>
      {children}
    </GuardianThemeContext.Provider>
  )
}
