import { Directory, File, Paths } from 'expo-file-system'
import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite'

import {
  runFts5Probe,
  type EnginePorts,
  type FileSystemPort,
  type SqliteDb,
  type SqlitePort,
} from '@aletheia/module-engine'

import { createCryptoPort, createHttpPort } from './ports-shared'

/** Sandbox nativo: directorio de documentos de la app (Android). */
export function getSandboxDir(): string {
  return Paths.document.uri
}

class ExpoFileSystemAdapter implements FileSystemPort {
  async exists(path: string): Promise<boolean> {
    try {
      const file = new File(path)
      if (file.exists) return true
    } catch {
      // no es un archivo accesible: probar como directorio
    }
    try {
      const dir = new Directory(path)
      return dir.exists
    } catch {
      return false
    }
  }

  async mkdir(path: string): Promise<void> {
    const dir = new Directory(path)
    if (!dir.exists) dir.create({ intermediates: true })
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const file = new File(path)
    if (!file.exists) file.create({ intermediates: true })
    file.write(data)
  }

  async readFile(path: string): Promise<Uint8Array> {
    return new File(path).bytes()
  }

  async rm(path: string): Promise<void> {
    try {
      const dir = new Directory(path)
      if (dir.exists) {
        dir.delete()
        return
      }
    } catch {
      // no es un directorio: probar como archivo
    }
    try {
      const file = new File(path)
      if (file.exists) file.delete()
    } catch {
      // ya no existe
    }
  }

  async listDir(path: string): Promise<string[]> {
    return new Directory(path)
      .list()
      .map((entry) => entry.name)
      .sort()
  }
}

class ExpoSqliteAdapter implements SqlitePort {
  async openReadOnly(path: string): Promise<SqliteDb> {
    // Una conexion nativa por ruta y sesion JS (cache a nivel de modulo,
    // sobrevive a Fast Refresh): cada busqueda global abria una conexion por
    // modulo y, como close() es intencionadamente no-op (SIGABRT ~56), las
    // conexiones huerfanas acaban colgando el puente nativo de Expo Go
    // (prepareAsync → NullPointerException en TODAS las queries, verificado
    // en emulador 2026-09-11: solo lo arregla un force-stop). Todo nuestro
    // acceso es de lectura, compartir es seguro.
    const cached = sharedDbCache.get(path)
    if (cached) return cached
    const opened = openSharedReadOnly(path).catch((e) => {
      if (sharedDbCache.get(path) === opened) sharedDbCache.delete(path)
      throw e
    })
    sharedDbCache.set(path, opened)
    return opened
  }
}

/** Cache de conexiones compartidas por ruta (vive lo que el runtime JS). */
const sharedDbCache = new Map<string, Promise<SqliteDb>>()

async function openSharedReadOnly(path: string): Promise<SqliteDb> {
    const dir = path.slice(0, path.lastIndexOf('/'))
    const name = path.slice(path.lastIndexOf('/') + 1)
    const db: SQLiteDatabase = await openDatabaseAsync(name, undefined, dir)
    return {
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
      // Intencionadamente no-op: expo-sqlite ~56 aborta el proceso (SIGABRT
      // en sqlite3_close -> exsqlite3_finalize) al cerrar bases en Android
      // (tombstone verificado en emulador). Los lectores se abren una vez
      // por modulo y sesion; se liberan al morir el proceso.
      close: () => Promise.resolve(),
    }
}

/**
 * Probe FTS5 sobre expo-sqlite :memory: con el SQL compartido del engine.
 * Intencionadamente sin close(): expo-sqlite ~56 aborta el proceso (SIGABRT
 * en sqlite3_close -> exsqlite3_finalize) al cerrar esta base en Android.
 */
export async function probeFts5Support(): Promise<boolean> {
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
      close: () => Promise.resolve(),
    }
    return await runFts5Probe(port)
  } catch {
    return false
  }
}

export function createEnginePorts(): EnginePorts {
  return {
    fs: new ExpoFileSystemAdapter(),
    crypto: createCryptoPort(),
    sqlite: new ExpoSqliteAdapter(),
    http: createHttpPort(),
  }
}
