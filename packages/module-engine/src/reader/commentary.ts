import { ModuleOpenError } from '../errors'
import type { SqliteDb } from '../ports'

export interface CommentaryEntry {
  osisCode: string
  bookName: string
  chapter: number
  verse: number
  text: string
}

/** Lector de modulos type=commentary (JFB, TSK): entries + FTS5 (AMF-SPEC §3.2). */
export class CommentaryReader {
  constructor(private readonly db: SqliteDb) {}

  /** Comentario de un versiculo concreto; undefined si el modulo no lo cubre. */
  async getEntry(osisCode: string, chapter: number, verse: number): Promise<CommentaryEntry | undefined> {
    const row = await this.db.get<CommentaryEntry>(
      `SELECT b.osisCode AS osisCode, b.name AS bookName, e.chapter, e.verse, e.text
       FROM entries e JOIN books b ON b.bookId = e.bookId
       WHERE b.osisCode = ? AND e.chapter = ? AND e.verse = ?
       LIMIT 1`,
      [osisCode, chapter, verse],
    )
    // bun:sqlite devuelve null (no undefined) sin fila.
    return row ?? undefined
  }

  /** Todas las entradas del capitulo (panel Estudio sincronizado por pasaje). */
  async getChapterEntries(osisCode: string, chapter: number): Promise<CommentaryEntry[]> {
    return this.db.all<CommentaryEntry>(
      `SELECT b.osisCode AS osisCode, b.name AS bookName, e.chapter, e.verse, e.text
       FROM entries e JOIN books b ON b.bookId = e.bookId
       WHERE b.osisCode = ? AND e.chapter = ?
       ORDER BY e.verse`,
      [osisCode, chapter],
    )
  }

  async requireBook(osisCode: string): Promise<void> {
    const row = await this.db.get<{ osisCode: string }>(
      'SELECT osisCode FROM books WHERE osisCode = ?',
      [osisCode],
    )
    if (!row) throw new ModuleOpenError(`libro ${osisCode} no presente en este modulo`)
  }

  /**
   * Busqueda FTS5 sobre el comentario (misma tokenizacion sin diacriticos
   * que las biblias). Sintaxis MATCH de FTS5; errores se propagan.
   */
  async searchEntries(query: string, limit = 50): Promise<CommentaryEntry[]> {
    const rows = await this.db.all<{
      osisCode: string
      bookName: string
      chapter: number
      verse: number
      text: string
    }>(
      `SELECT b.osisCode AS osisCode, b.name AS bookName, e.chapter, e.verse, e.text
       FROM entries_fts f
       JOIN entries e ON e.rowid = f.rowid
       JOIN books b ON b.bookId = e.bookId
       WHERE entries_fts MATCH ?
       ORDER BY b.bookOrder, e.chapter, e.verse
       LIMIT ?`,
      [query, limit],
    )
    return rows
  }
}
