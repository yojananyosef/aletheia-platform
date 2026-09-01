import type { ThemeName } from '../settings/reader-settings'

/**
 * Los 8 tokens del lector heredados del legacy (reader-bg/text/border/muted/accent/
 * accent-fg/hover/accent-subtle) para los 3 temas. Sin blanco puro ni negro puro.
 */
export interface ThemeTokens {
  readerBg: string
  readerText: string
  readerBorder: string
  readerMuted: string
  accent: string
  accentFg: string
  hover: string
  accentSubtle: string
}

export const THEME_TOKENS: Record<ThemeName, ThemeTokens> = {
  pergamino: {
    readerBg: '#f5eede',
    readerText: '#33281a',
    readerBorder: '#d8c9a8',
    readerMuted: '#7a6a4f',
    accent: '#8a5a2b',
    accentFg: '#f5eede',
    hover: '#ece2cc',
    accentSubtle: '#e5d5b5',
  },
  sepia: {
    readerBg: '#e8dcc3',
    readerText: '#413421',
    readerBorder: '#c9b68d',
    readerMuted: '#6e5c40',
    accent: '#7c4f24',
    accentFg: '#e8dcc3',
    hover: '#ddceac',
    accentSubtle: '#d6c197',
  },
  noche: {
    readerBg: '#1c1a17',
    readerText: '#d9d2c5',
    readerBorder: '#3a352d',
    readerMuted: '#918977',
    accent: '#c99b5f',
    accentFg: '#1c1a17',
    hover: '#282520',
    accentSubtle: '#33302a',
  },
}

export function themeTokens(theme: ThemeName): ThemeTokens {
  return THEME_TOKENS[theme]
}
