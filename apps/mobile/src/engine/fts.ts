import { openDatabaseAsync, type SQLiteBindParams } from 'expo-sqlite'

import { runFts5Probe, type SqliteDb } from '@aletheia/module-engine'

/**
 * Verifica FTS5 en el dispositivo (AMF-SPEC §3.2) usando el probe compartido
 * del module-engine: el SQL es el mismo que validan los tests headless con
 * bun:sqlite, aqui solo cambia el adaptador (expo-sqlite :memory:).
 *
 * El resultado se cachea por sesion: el probe corre una sola vez.
 *
 * NOTA (verificado en emulador, tombstone 2026-09-11): NO cerrar la base
 * :memory: con `closeAsync()`. expo-sqlite ~56 aborta el proceso (SIGABRT
 * en `sqlite3_close` -> `exsqlite3_finalize`, heap-corrupto segun scudo)
 * al cerrar esta base. Se deja una unica :memory: vacia abierta por sesion
 * (unos pocos KB) y se evita el crash.
 */
let cached: Promise<boolean> | null = null

export function verifyFts5Support(): Promise<boolean> {
  cached ??= runProbeWithRetry()
  return cached
}

/**
 * Un reintento tras una pausa breve: durante un Fast Refresh (solo dev) el
 * primer intento puede correr a mitad de la recarga y fallar de forma
 * transitoria (verificado: chip "no soportado" que se corrige solo al
 * recargar en limpio). En produccion el primer intento basta.
 */
async function runProbeWithRetry(): Promise<boolean> {
  if (await runProbeOnce()) return true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return runProbeOnce()
}

async function runProbeOnce(): Promise<boolean> {
  try {
    const db = await openDatabaseAsync(':memory:')
    const port: SqliteDb = {
      get: async <T>(sql: string, params?: ReadonlyArray<string | number | null>) =>
        (await db.getFirstAsync<T>(sql, params as SQLiteBindParams)) ?? undefined,
      all: async <T>(sql: string, params?: ReadonlyArray<string | number | null>) =>
        await db.getAllAsync<T>(sql, params as SQLiteBindParams),
      exec: async (sql: string, params?: ReadonlyArray<string | number | null>) => {
        if (params === undefined || params.length === 0) {
          await db.execAsync(sql)
        } else {
          await db.runAsync(sql, params as SQLiteBindParams)
        }
      },
      // Intencionadamente no-op: ver NOTA arriba. Tampoco se llama a
      // db.closeAsync() en ningun camino de esta funcion.
      close: () => Promise.resolve(),
    }
    return await runFts5Probe(port)
  } catch {
    return false
  }
}
