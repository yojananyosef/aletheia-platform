// Canon de 66 libros (versificacion KJV estandar) — hechos publicos, misma tabla
// de referencia que aletheia-catalog. Los modulos .amod traen su propia tabla `books`;
// este canon es el default para UI/TOC cuando no hay modulo cargado.
export interface CanonBook {
  name: string
  osis: string
  abbrev: string
  chapmax: number
  testament: 'OT' | 'NT'
}

export const CANON_BOOKS: CanonBook[] = [
  { name: "Genesis", osis: "Gen", abbrev: "Gen", chapmax: 50, testament: "OT" },
  { name: "Exodus", osis: "Exod", abbrev: "Exod", chapmax: 40, testament: "OT" },
  { name: "Leviticus", osis: "Lev", abbrev: "Lev", chapmax: 27, testament: "OT" },
  { name: "Numbers", osis: "Num", abbrev: "Num", chapmax: 36, testament: "OT" },
  { name: "Deuteronomy", osis: "Deut", abbrev: "Deut", chapmax: 34, testament: "OT" },
  { name: "Joshua", osis: "Josh", abbrev: "Josh", chapmax: 24, testament: "OT" },
  { name: "Judges", osis: "Judg", abbrev: "Judg", chapmax: 21, testament: "OT" },
  { name: "Ruth", osis: "Ruth", abbrev: "Ruth", chapmax: 4, testament: "OT" },
  { name: "I Samuel", osis: "1Sam", abbrev: "1Sam", chapmax: 31, testament: "OT" },
  { name: "II Samuel", osis: "2Sam", abbrev: "2Sam", chapmax: 24, testament: "OT" },
  { name: "I Kings", osis: "1Kgs", abbrev: "1Kgs", chapmax: 22, testament: "OT" },
  { name: "II Kings", osis: "2Kgs", abbrev: "2Kgs", chapmax: 25, testament: "OT" },
  { name: "I Chronicles", osis: "1Chr", abbrev: "1Chr", chapmax: 29, testament: "OT" },
  { name: "II Chronicles", osis: "2Chr", abbrev: "2Chr", chapmax: 36, testament: "OT" },
  { name: "Ezra", osis: "Ezra", abbrev: "Ezra", chapmax: 10, testament: "OT" },
  { name: "Nehemiah", osis: "Neh", abbrev: "Neh", chapmax: 13, testament: "OT" },
  { name: "Esther", osis: "Esth", abbrev: "Esth", chapmax: 10, testament: "OT" },
  { name: "Job", osis: "Job", abbrev: "Job", chapmax: 42, testament: "OT" },
  { name: "Psalms", osis: "Ps", abbrev: "Ps", chapmax: 150, testament: "OT" },
  { name: "Proverbs", osis: "Prov", abbrev: "Prov", chapmax: 31, testament: "OT" },
  { name: "Ecclesiastes", osis: "Eccl", abbrev: "Eccl", chapmax: 12, testament: "OT" },
  { name: "Song of Solomon", osis: "Song", abbrev: "Song", chapmax: 8, testament: "OT" },
  { name: "Isaiah", osis: "Isa", abbrev: "Isa", chapmax: 66, testament: "OT" },
  { name: "Jeremiah", osis: "Jer", abbrev: "Jer", chapmax: 52, testament: "OT" },
  { name: "Lamentations", osis: "Lam", abbrev: "Lam", chapmax: 5, testament: "OT" },
  { name: "Ezekiel", osis: "Ezek", abbrev: "Ezek", chapmax: 48, testament: "OT" },
  { name: "Daniel", osis: "Dan", abbrev: "Dan", chapmax: 12, testament: "OT" },
  { name: "Hosea", osis: "Hos", abbrev: "Hos", chapmax: 14, testament: "OT" },
  { name: "Joel", osis: "Joel", abbrev: "Joel", chapmax: 3, testament: "OT" },
  { name: "Amos", osis: "Amos", abbrev: "Amos", chapmax: 9, testament: "OT" },
  { name: "Obadiah", osis: "Obad", abbrev: "Obad", chapmax: 1, testament: "OT" },
  { name: "Jonah", osis: "Jonah", abbrev: "Jonah", chapmax: 4, testament: "OT" },
  { name: "Micah", osis: "Mic", abbrev: "Mic", chapmax: 7, testament: "OT" },
  { name: "Nahum", osis: "Nah", abbrev: "Nah", chapmax: 3, testament: "OT" },
  { name: "Habakkuk", osis: "Hab", abbrev: "Hab", chapmax: 3, testament: "OT" },
  { name: "Zephaniah", osis: "Zeph", abbrev: "Zeph", chapmax: 3, testament: "OT" },
  { name: "Haggai", osis: "Hag", abbrev: "Hag", chapmax: 2, testament: "OT" },
  { name: "Zechariah", osis: "Zech", abbrev: "Zech", chapmax: 14, testament: "OT" },
  { name: "Malachi", osis: "Mal", abbrev: "Mal", chapmax: 4, testament: "OT" },
  { name: "Matthew", osis: "Matt", abbrev: "Matt", chapmax: 28, testament: "NT" },
  { name: "Mark", osis: "Mark", abbrev: "Mark", chapmax: 16, testament: "NT" },
  { name: "Luke", osis: "Luke", abbrev: "Luke", chapmax: 24, testament: "NT" },
  { name: "John", osis: "John", abbrev: "John", chapmax: 21, testament: "NT" },
  { name: "Acts", osis: "Acts", abbrev: "Acts", chapmax: 28, testament: "NT" },
  { name: "Romans", osis: "Rom", abbrev: "Rom", chapmax: 16, testament: "NT" },
  { name: "I Corinthians", osis: "1Cor", abbrev: "1Cor", chapmax: 16, testament: "NT" },
  { name: "II Corinthians", osis: "2Cor", abbrev: "2Cor", chapmax: 13, testament: "NT" },
  { name: "Galatians", osis: "Gal", abbrev: "Gal", chapmax: 6, testament: "NT" },
  { name: "Ephesians", osis: "Eph", abbrev: "Eph", chapmax: 6, testament: "NT" },
  { name: "Philippians", osis: "Phil", abbrev: "Phil", chapmax: 4, testament: "NT" },
  { name: "Colossians", osis: "Col", abbrev: "Col", chapmax: 4, testament: "NT" },
  { name: "I Thessalonians", osis: "1Thess", abbrev: "1Thess", chapmax: 5, testament: "NT" },
  { name: "II Thessalonians", osis: "2Thess", abbrev: "2Thess", chapmax: 3, testament: "NT" },
  { name: "I Timothy", osis: "1Tim", abbrev: "1Tim", chapmax: 6, testament: "NT" },
  { name: "II Timothy", osis: "2Tim", abbrev: "2Tim", chapmax: 4, testament: "NT" },
  { name: "Titus", osis: "Titus", abbrev: "Titus", chapmax: 3, testament: "NT" },
  { name: "Philemon", osis: "Phlm", abbrev: "Phlm", chapmax: 1, testament: "NT" },
  { name: "Hebrews", osis: "Heb", abbrev: "Heb", chapmax: 13, testament: "NT" },
  { name: "James", osis: "Jas", abbrev: "Jas", chapmax: 5, testament: "NT" },
  { name: "I Peter", osis: "1Pet", abbrev: "1Pet", chapmax: 5, testament: "NT" },
  { name: "II Peter", osis: "2Pet", abbrev: "2Pet", chapmax: 3, testament: "NT" },
  { name: "I John", osis: "1John", abbrev: "1John", chapmax: 5, testament: "NT" },
  { name: "II John", osis: "2John", abbrev: "2John", chapmax: 1, testament: "NT" },
  { name: "III John", osis: "3John", abbrev: "3John", chapmax: 1, testament: "NT" },
  { name: "Jude", osis: "Jude", abbrev: "Jude", chapmax: 1, testament: "NT" },
  { name: "Revelation of John", osis: "Rev", abbrev: "Rev", chapmax: 22, testament: "NT" },
]

export const canonByOsis = new Map(CANON_BOOKS.map((b) => [b.osis, b]))

export function bookByOsis(osis: string): CanonBook | undefined {
  return canonByOsis.get(osis)
}

export function bookOrder(osis: string): number {
  const i = CANON_BOOKS.findIndex((b) => b.osis === osis)
  return i >= 0 ? i + 1 : -1
}
