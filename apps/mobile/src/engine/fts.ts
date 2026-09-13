import { probeFts5Support } from './adapters'

/**
 * Verifica FTS5 en la plataforma (AMF-SPEC §3.2) con el probe compartido del
 * module-engine: el SQL es el mismo que validan los tests headless con
 * bun:sqlite; aqui solo cambia el adaptador (expo-sqlite :memory: en nativo,
 * sql.js :memory: en web). Metro resuelve './adapters' por plataforma.
 *
 * El resultado se cachea por sesion: el probe corre una sola vez.
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
  if (await probeFts5Support()) return true
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return probeFts5Support()
}
