import type { SqliteDb } from '../ports'

export interface DictionaryEntry {
  key: string
  strongs?: string | undefined
  content: string
}

/**
 * Lector de modulos type=dictionary|lexicon (SMITH, Easton, Nave, ISBE,
 * Hitchcock, StrongsGreek/Hebrew, Abbott-Smith): entries + FTS5.
 */
export class DictionaryReader {
  constructor(private readonly db: SqliteDb) {}

  /** Lookup exacto por clave (long-press de palabra en el lector F4). */
  async lookup(key: string): Promise<DictionaryEntry | undefined> {
    const norm = key.trim()
    if (!norm) return undefined
    const exact = await this.db.get<{ key: string; strongs: string | null; content: string }>(
      'SELECT key, strongs, content FROM entries WHERE key = ? COLLATE NOCASE LIMIT 1',
      [norm],
    )
    if (exact) return { key: exact.key, strongs: exact.strongs ?? undefined, content: exact.content }
    return this.db.get<{ key: string; strongs: string | null; content: string }>(
      'SELECT key, strongs, content FROM entries WHERE sortKey = ? LIMIT 1',
      [sortKeyOf(norm)],
    ).then((row) =>
      row ? { key: row.key, strongs: row.strongs ?? undefined, content: row.content } : undefined,
    )
  }

  /** Autocompletado por prefijo (insensible a acentos/mayusculas). */
  async lookupPrefix(prefix: string, limit = 20): Promise<DictionaryEntry[]> {
    const norm = sortKeyOf(prefix.trim())
    if (!norm) return []
    const rows = await this.db.all<{ key: string; strongs: string | null; content: string }>(
      `SELECT key, strongs, content FROM entries
       WHERE sortKey LIKE ? ESCAPE '\\'
       ORDER BY sortKey, key
       LIMIT ?`,
      [`${escapeLike(norm)}%`, limit],
    )
    return rows.map((r) => ({ key: r.key, strongs: r.strongs ?? undefined, content: r.content }))
  }

  /** Entradas de lexico por codigo Strong (G3056/H7225) — base del F12. */
  async getByStrongs(strongs: string, limit = 10): Promise<DictionaryEntry[]> {
    const norm = strongs.trim().toUpperCase()
    if (!norm) return []
    const rows = await this.db.all<{ key: string; strongs: string | null; content: string }>(
      'SELECT key, strongs, content FROM entries WHERE strongs = ? LIMIT ?',
      [norm, limit],
    )
    return rows.map((r) => ({ key: r.key, strongs: r.strongs ?? undefined, content: r.content }))
  }

  /** Busqueda FTS5 sobre el contenido de las entradas. */
  async searchEntries(query: string, limit = 50): Promise<DictionaryEntry[]> {
    const rows = await this.db.all<{ key: string; strongs: string | null; content: string }>(
      `SELECT e.key, e.strongs, e.content
       FROM entries_fts f
       JOIN entries e ON e.rowid = f.rowid
       WHERE entries_fts MATCH ?
       LIMIT ?`,
      [query, limit],
    )
    return rows.map((r) => ({ key: r.key, strongs: r.strongs ?? undefined, content: r.content }))
  }

  async count(): Promise<number> {
    const row = await this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM entries')
    return row?.n ?? 0
  }
}

export function sortKeyOf(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function escapeLike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}
