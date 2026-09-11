import { describe, expect, test } from 'bun:test'
import { CANON_BOOKS } from '../src/canon/books'
import { dayOfYear, VERSE_OF_DAY_CYCLE, verseOfDayRef, verseRefLabel, type VerseRef } from '../src/reading/verse-of-day'

describe('verseOfDay', () => {
  test('dayOfYear: 1 ene -> 1, dias conocidos estables en UTC', () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 1)))).toBe(1)
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 31)))).toBe(31)
    expect(dayOfYear(new Date(Date.UTC(2026, 11, 31)))).toBe(365)
  })

  test('rotacion determinista sobre el ciclo y etiquetas', () => {
    const jan1 = verseOfDayRef(new Date(Date.UTC(2026, 0, 1)))
    expect(jan1).toEqual(VERSE_OF_DAY_CYCLE[0] as VerseRef)
    const jan15 = verseOfDayRef(new Date(Date.UTC(2026, 0, 15)))
    expect(jan15).toEqual(VERSE_OF_DAY_CYCLE[14 % VERSE_OF_DAY_CYCLE.length] as VerseRef)
    // Vuelta completa del ciclo.
    const again = verseOfDayRef(new Date(Date.UTC(2026, 0, 1 + VERSE_OF_DAY_CYCLE.length)))
    expect(again).toEqual(jan1)
    expect(verseRefLabel({ osisCode: 'Gen', chapter: 1, verse: 1 }, 'Genesis')).toBe('Genesis 1:1')
  })

  test('el ciclo solo usa libros del canon de 66', () => {
    const codes = new Set(CANON_BOOKS.map((b) => b.osis))
    for (const ref of VERSE_OF_DAY_CYCLE) {
      expect(codes.has(ref.osisCode)).toBe(true)
    }
  })
})
