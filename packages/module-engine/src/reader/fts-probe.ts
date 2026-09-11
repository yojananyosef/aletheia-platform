import type { SqliteDb } from '../ports'

/**
 * Probe FTS5 (AMF-SPEC §3.2): verifica que la compilacion SQLite incluya
 * ENABLE_FTS5 y que el tokenizer `unicode61 remove_diacritics 2`
 * ("Jesús" ≈ "JESUS") funcione. Corre sobre una base :memory: y no toca
 * modulos instalados.
 *
 * El SQL vive aqui (agnostico a la plataforma) para que los tests headless
 * (bun:sqlite) validen exactamente lo mismo que la app corre en el
 * dispositivo con expo-sqlite. El movil solo inyecta el adaptador.
 */
export const FTS5_COMPILE_OPTION_SQL =
  "SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled"

export const FTS5_PROBE_CREATE_SQL =
  "CREATE VIRTUAL TABLE fts_probe USING fts5(text, tokenize = 'unicode61 remove_diacritics 2')"

export const FTS5_PROBE_INSERT_SQL = 'INSERT INTO fts_probe (text) VALUES (?)'

export const FTS5_PROBE_MATCH_SQL = 'SELECT COUNT(*) AS n FROM fts_probe WHERE fts_probe MATCH ?'

export const FTS5_PROBE_SAMPLE_TEXT = 'Jesús amó a los pequeños'

export const FTS5_PROBE_QUERY = 'JESUS'

export async function runFts5Probe(db: SqliteDb): Promise<boolean> {
  try {
    const compiled = await db.get<{ enabled: number }>(FTS5_COMPILE_OPTION_SQL)
    if (!compiled || compiled.enabled !== 1) return false
    await db.exec(FTS5_PROBE_CREATE_SQL)
    await db.exec(FTS5_PROBE_INSERT_SQL, [FTS5_PROBE_SAMPLE_TEXT])
    const match = await db.get<{ n: number }>(FTS5_PROBE_MATCH_SQL, [FTS5_PROBE_QUERY])
    return (match?.n ?? 0) === 1
  } catch {
    return false
  }
}
