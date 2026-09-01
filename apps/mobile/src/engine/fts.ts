import { openDatabaseAsync } from 'expo-sqlite'

/**
 * Verifica FTS5 en el dispositivo (AMF-SPEC §3.2): la compilación de expo-sqlite
 * debe incluir ENABLE_FTS5 y el tokenizer unicode61 remove_diacritics 2
 * ("Jesús" ≈ "JESUS"). Corre en una base :memory: y no toca módulos instalados.
 */
export async function verifyFts5Support(): Promise<boolean> {
  const db = await openDatabaseAsync(':memory:')
  try {
    const compiled = await db.getFirstAsync<{ enabled: number }>(
      "SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled",
    )
    if (!compiled || compiled.enabled !== 1) return false
    await db.execAsync(
      "CREATE VIRTUAL TABLE fts_probe USING fts5(text, tokenize = 'unicode61 remove_diacritics 2')",
    )
    await db.runAsync('INSERT INTO fts_probe (text) VALUES (?)', ['Jesús amó a los pequeños'])
    const match = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM fts_probe WHERE fts_probe MATCH 'JESUS'",
    )
    return (match?.n ?? 0) === 1
  } catch {
    return false
  } finally {
    await db.closeAsync()
  }
}
