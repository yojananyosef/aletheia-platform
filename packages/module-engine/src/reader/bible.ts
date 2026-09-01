import { ModuleOpenError } from '../errors'
import type { SqliteDb } from '../ports'
import type { ModuleFeatures } from '../types'

export interface BibleBook {
  bookId: number
  osisCode: string
  name: string
  abbreviation: string
  testament: 'OT' | 'NT'
  bookOrder: number
  chapterCount: number
}

export interface VerseText {
  verse: number
  /** rango (AMF-SPEC §3.2): undefined = versiculo simple */
  verseEnd?: number | undefined
  text: string
}

export interface Heading {
  /** el titulo antecede a este versiculo */
  beforeVerse: number
  title: string
}

export interface Footnote {
  verse: number
  caller: string
  text: string
}

export interface ChapterContent {
  book: BibleBook
  chapter: number
  headings: Heading[]
  verses: VerseText[]
  footnotes: Footnote[]
}

export interface VerseSearchResult {
  bookId: number
  osisCode: string
  bookName: string
  chapter: number
  verse: number
  verseEnd?: number | undefined
  text: string
}

interface BookRow {
  bookId: number
  osisCode: string
  name: string
  abbreviation: string
  testament: 'OT' | 'NT'
  bookOrder: number
  chapterCount: number
}

/** Lector de modulos type=bible (verses/headings/footnotes + FTS5, AMF-SPEC §3.2). */
export class BibleReader {
  constructor(
    private readonly db: SqliteDb,
    private readonly features?: Pick<ModuleFeatures, 'hasHeadings' | 'hasFootnotes'>,
  ) {}

  async listBooks(): Promise<BibleBook[]> {
    const rows = await this.db.all<BookRow>(
      'SELECT bookId, osisCode, name, abbreviation, testament, bookOrder, chapterCount FROM books ORDER BY bookOrder',
    )
    return rows
  }

  async getBook(osisCode: string): Promise<BibleBook> {
    const row = await this.db.get<BookRow>(
      'SELECT bookId, osisCode, name, abbreviation, testament, bookOrder, chapterCount FROM books WHERE osisCode = ?',
      [osisCode],
    )
    if (!row) throw new ModuleOpenError(`libro ${osisCode} no presente en este modulo`)
    return row
  }

  async getChapter(osisCode: string, chapter: number): Promise<ChapterContent> {
    const book = await this.getBook(osisCode)
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapterCount) {
      throw new ModuleOpenError(`capitulo ${String(chapter)} fuera de rango para ${osisCode} (1..${book.chapterCount})`)
    }
    const verses = (
      await this.db.all<{ verse: number; verseEnd: number | null; text: string }>(
        'SELECT verse, verseEnd, text FROM verses WHERE bookId = ? AND chapter = ? ORDER BY verse',
        [book.bookId, chapter],
      )
    ).map((v) => ({ verse: v.verse, verseEnd: v.verseEnd ?? undefined, text: v.text }))
    const headings =
      this.features?.hasHeadings === false
        ? []
        : await this.db.all<{ beforeVerse: number; title: string }>(
            'SELECT beforeVerse, title FROM sections WHERE bookId = ? AND chapter = ? ORDER BY beforeVerse',
            [book.bookId, chapter],
          ).catch(() => [] as Array<{ beforeVerse: number; title: string }>)
    const footnotes =
      this.features?.hasFootnotes === false
        ? []
        : await this.db.all<{ verse: number; caller: string; text: string }>(
            'SELECT verse, caller, text FROM footnotes WHERE bookId = ? AND chapter = ? ORDER BY verse, id',
            [book.bookId, chapter],
          ).catch(() => [] as Array<{ verse: number; caller: string; text: string }>)
    return { book, chapter, headings, verses, footnotes }
  }

  /**
   * Busqueda FTS5 con unicode61 remove_diacritics 2 ("Jesús" ≈ "jesus").
   * query usa sintaxis MATCH de FTS5; errores de sintaxis se propagan tal cual.
   */
  async searchVerses(query: string, limit = 50): Promise<VerseSearchResult[]> {
    const rows = await this.db.all<{
      bookId: number
      osisCode: string
      bookName: string
      chapter: number
      verse: number
      verseEnd: number | null
      text: string
    }>(
      `SELECT v.bookId, b.osisCode, b.name AS bookName, v.chapter, v.verse, v.verseEnd, v.text
       FROM verses_fts
       JOIN verses v ON v.rowid = verses_fts.rowid
       JOIN books b ON b.bookId = v.bookId
       WHERE verses_fts MATCH ?
       ORDER BY b.bookOrder, v.chapter, v.verse
       LIMIT ?`,
      [query, limit],
    )
    return rows.map((r) => ({ ...r, verseEnd: r.verseEnd ?? undefined }))
  }
}
