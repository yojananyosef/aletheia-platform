export type ThemeName = 'pergamino' | 'sepia' | 'noche'

export type FontFamilyId = 'system' | 'opendyslexic' | 'atkinson' | 'literata'

export type ColumnMode = '1' | '2' | 'auto'

export interface ReaderSettings {
  theme: ThemeName
  fontFamily: FontFamilyId
  /** pt tipografico base del texto biblico */
  fontSize: number
  /** multiplicador de interlineado (1 = normal) */
  lineHeight: number
  /** letter-spacing en unidades relativas (0 = normal) */
  letterSpacing: number
  columns: ColumnMode
  verseNumbers: boolean
  footnotes: boolean
  bionicReading: boolean
  syllablePoints: boolean
  lineFocus: boolean
  simpleReadingMode: boolean
}

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'pergamino',
  fontFamily: 'literata',
  fontSize: 18,
  lineHeight: 1.6,
  letterSpacing: 0,
  columns: 'auto',
  verseNumbers: true,
  footnotes: true,
  bionicReading: false,
  syllablePoints: false,
  lineFocus: false,
  simpleReadingMode: false,
}

const THEME_NAMES: readonly ThemeName[] = ['pergamino', 'sepia', 'noche']
const FONT_IDS: readonly FontFamilyId[] = ['system', 'opendyslexic', 'atkinson', 'literata']
const COLUMN_MODES: readonly ColumnMode[] = ['1', '2', 'auto']

export const FONT_SIZE_MIN = 12
export const FONT_SIZE_MAX = 32
export const LINE_HEIGHT_MIN = 1.0
export const LINE_HEIGHT_MAX = 2.4
export const LETTER_SPACING_MIN = -0.5
export const LETTER_SPACING_MAX = 2

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * Mezcla un partial sobre los defaults validando y clampeando cada campo.
 * Campos desconocidos se ignoran (evolucion compatible).
 */
export function resolveReaderSettings(partial: Partial<ReaderSettings> | undefined | null): ReaderSettings {
  const p = partial ?? {}
  return {
    theme: oneOf(p.theme, THEME_NAMES) ?? DEFAULT_READER_SETTINGS.theme,
    fontFamily: oneOf(p.fontFamily, FONT_IDS) ?? DEFAULT_READER_SETTINGS.fontFamily,
    fontSize: clamp(p.fontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_READER_SETTINGS.fontSize),
    lineHeight: clamp(p.lineHeight, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX, DEFAULT_READER_SETTINGS.lineHeight),
    letterSpacing: clamp(
      p.letterSpacing,
      LETTER_SPACING_MIN,
      LETTER_SPACING_MAX,
      DEFAULT_READER_SETTINGS.letterSpacing,
    ),
    columns: oneOf(p.columns, COLUMN_MODES) ?? DEFAULT_READER_SETTINGS.columns,
    verseNumbers: typeof p.verseNumbers === 'boolean' ? p.verseNumbers : DEFAULT_READER_SETTINGS.verseNumbers,
    footnotes: typeof p.footnotes === 'boolean' ? p.footnotes : DEFAULT_READER_SETTINGS.footnotes,
    bionicReading: typeof p.bionicReading === 'boolean' ? p.bionicReading : DEFAULT_READER_SETTINGS.bionicReading,
    syllablePoints:
      typeof p.syllablePoints === 'boolean' ? p.syllablePoints : DEFAULT_READER_SETTINGS.syllablePoints,
    lineFocus: typeof p.lineFocus === 'boolean' ? p.lineFocus : DEFAULT_READER_SETTINGS.lineFocus,
    simpleReadingMode:
      typeof p.simpleReadingMode === 'boolean'
        ? p.simpleReadingMode
        : DEFAULT_READER_SETTINGS.simpleReadingMode,
  }
}

/** Serializacion persistente (JSON estable: solo campos con valor distinto al default). */
export function serializeReaderSettings(settings: ReaderSettings): string {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_READER_SETTINGS) as (keyof ReaderSettings)[]) {
    if (settings[key] !== DEFAULT_READER_SETTINGS[key]) out[key] = settings[key]
  }
  return JSON.stringify(out)
}

export function parseReaderSettings(json: string | undefined | null): ReaderSettings {
  if (!json) return DEFAULT_READER_SETTINGS
  try {
    return resolveReaderSettings(JSON.parse(json) as Partial<ReaderSettings>)
  } catch {
    return DEFAULT_READER_SETTINGS
  }
}
