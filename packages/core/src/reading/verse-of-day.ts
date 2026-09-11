/** Referencia de versiculo de dominio publico para rotar por dia del año (F4). */

export interface VerseRef {
  osisCode: string
  chapter: number
  verse: number
}

/**
 * Ciclo de 14 pasajes (el texto se resuelve en runtime desde la Biblia
 * instalada; sin modulo solo se muestra la referencia). Todos existen en
 * cualquier canon protestante de 66 libros.
 */
export const VERSE_OF_DAY_CYCLE: readonly VerseRef[] = [
  { osisCode: 'Gen', chapter: 1, verse: 1 },
  { osisCode: 'Ps', chapter: 23, verse: 1 },
  { osisCode: 'Ps', chapter: 119, verse: 105 },
  { osisCode: 'Prov', chapter: 3, verse: 5 },
  { osisCode: 'Isa', chapter: 41, verse: 10 },
  { osisCode: 'Jer', chapter: 29, verse: 11 },
  { osisCode: 'Mic', chapter: 6, verse: 8 },
  { osisCode: 'Matt', chapter: 5, verse: 3 },
  { osisCode: 'John', chapter: 3, verse: 16 },
  { osisCode: 'John', chapter: 1, verse: 1 },
  { osisCode: 'Rom', chapter: 8, verse: 28 },
  { osisCode: 'Phil', chapter: 4, verse: 13 },
  { osisCode: 'Heb', chapter: 11, verse: 1 },
  { osisCode: 'Rev', chapter: 22, verse: 21 },
]

/** Dia del año 1..366 (UTC, estable entre zonas horarias). */
export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  return Math.floor((date.getTime() - start) / 86_400_000)
}

/** Referencia del dia: rotacion determinista sobre el ciclo. */
export function verseOfDayRef(date: Date = new Date()): VerseRef {
  const index = (dayOfYear(date) - 1) % VERSE_OF_DAY_CYCLE.length
  return VERSE_OF_DAY_CYCLE[index] as VerseRef
}

export function verseRefLabel(ref: Pick<VerseRef, 'osisCode' | 'chapter' | 'verse'>, bookName?: string): string {
  return `${bookName ?? ref.osisCode} ${String(ref.chapter)}:${String(ref.verse)}`
}
