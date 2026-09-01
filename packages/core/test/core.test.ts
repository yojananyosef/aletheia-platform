import { describe, expect, test } from 'bun:test'
import { CANON_BOOKS, bookByOsis, bookOrder } from '../src/canon/books'
import {
  DEFAULT_READER_SETTINGS,
  parseReaderSettings,
  resolveReaderSettings,
  serializeReaderSettings,
} from '../src/settings/reader-settings'
import { THEME_TOKENS, themeTokens } from '../src/theme/tokens'

describe('canon', () => {
  test('66 libros en orden canonico', () => {
    expect(CANON_BOOKS).toHaveLength(66)
    const ot = CANON_BOOKS.filter((b) => b.testament === 'OT')
    const nt = CANON_BOOKS.filter((b) => b.testament === 'NT')
    expect(ot).toHaveLength(39)
    expect(nt).toHaveLength(27)
    expect(CANON_BOOKS[0]?.osis).toBe('Gen')
    expect(CANON_BOOKS[65]?.osis).toBe('Rev')
  })

  test('rangos de capitulos conocidos', () => {
    expect(bookByOsis('Gen')?.chapmax).toBe(50)
    expect(bookByOsis('Ps')?.chapmax).toBe(150)
    expect(bookByOsis('Rev')?.chapmax).toBe(22)
    expect(bookByOsis('Jude')?.chapmax).toBe(1)
  })

  test('osis unicos y orden 1..66', () => {
    const osis = new Set(CANON_BOOKS.map((b) => b.osis))
    expect(osis.size).toBe(66)
    expect(bookOrder('Gen')).toBe(1)
    expect(bookOrder('Rev')).toBe(66)
    expect(bookOrder('Nope')).toBe(-1)
  })
})

describe('ReaderSettings', () => {
  test('defaults del tema pergamino con Literata', () => {
    expect(DEFAULT_READER_SETTINGS.theme).toBe('pergamino')
    expect(DEFAULT_READER_SETTINGS.fontFamily).toBe('literata')
    expect(DEFAULT_READER_SETTINGS.fontSize).toBe(18)
  })

  test('resolve clampea y descarta valores invalidos', () => {
    const s = resolveReaderSettings({
      theme: 'vaporwave' as never,
      fontSize: 999,
      lineHeight: 0.1,
      bionicReading: true,
    })
    expect(s.theme).toBe('pergamino')
    expect(s.fontSize).toBe(32)
    expect(s.lineHeight).toBe(1.0)
    expect(s.bionicReading).toBe(true)
  })

  test('serialize/parse roundtrip estable y compacto', () => {
    const s = resolveReaderSettings({ theme: 'noche', fontSize: 24 })
    const json = serializeReaderSettings(s)
    expect(JSON.parse(json)).toEqual({ theme: 'noche', fontSize: 24 })
    expect(parseReaderSettings(json)).toEqual(s)
  })

  test('parse de basura devuelve defaults', () => {
    expect(parseReaderSettings('no-json')).toEqual(DEFAULT_READER_SETTINGS)
    expect(parseReaderSettings(undefined)).toEqual(DEFAULT_READER_SETTINGS)
  })
})

describe('temas', () => {
  test('los 3 temas con los 8 tokens, sin blanco ni negro puro', () => {
    const names = ['pergamino', 'sepia', 'noche'] as const
    for (const name of names) {
      const t = themeTokens(name)
      expect(Object.keys(t).sort()).toEqual(
        ['accent', 'accentFg', 'accentSubtle', 'hover', 'readerBg', 'readerBorder', 'readerMuted', 'readerText'].sort(),
      )
      for (const value of Object.values(t)) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/)
        expect(value.toLowerCase()).not.toBe('#ffffff')
        expect(value.toLowerCase()).not.toBe('#000000')
      }
    }
    expect(THEME_TOKENS.pergamino.readerBg).not.toBe(THEME_TOKENS.noche.readerBg)
  })
})
