import { useContext } from 'react'
import { GuardianThemeContext, type GuardianTheme } from '../contexts/GuardianThemeContext'

export function useGuardianTheme(): GuardianTheme {
  return useContext(GuardianThemeContext)
}
