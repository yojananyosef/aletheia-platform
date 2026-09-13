import { Asset } from 'expo-asset'
import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm'

import {
  runFts5Probe,
  type EnginePorts,
  type FileSystemPort,
  type SqliteDb,
  type SqlitePort,
} from '@aletheia/module-engine'

import { createCryptoPort, createHttpPort } from './ports-shared'

/**
 * Puertos web (F5, foco Android+Web): expo-file-system no existe en web, asi
 * que el sandbox vive en OPFS (Origin Private File System, persistente por
 * origen) y SQLite corre en WASM con el build oficial (@sqlite.org/sqlite-wasm,
 * con FTS5 + unicode61 remove_diacritics — sql.js y wa-sqlite vienen SIN FTS5).
 * El content.db se deserializa desde los bytes de OPFS a memoria por apertura
 * (unos ms para ~3MB) y se cachea por sesion. El engine no cambia: solo
 * lectura (SELECT/PRAGMA), igual que en nativo.
 */

export const WEB_SANDBOX_ROOT = 'aletheia'

export function getSandboxDir(): string {
  return WEB_SANDBOX_ROOT
}

/** Raiz logica -> segmentos OPFS (el primer segmento es la raiz misma). */
function segmentsOf(path: string): string[] {
  const parts = path.split('/').filter((p) => p.length > 0)
  if (parts[0] === WEB_SANDBOX_ROOT) parts.shift()
  return parts
}

async function opfsRoot(create: boolean): Promise<FileSystemDirectoryHandle> {
  const opfs = await navigator.storage.getDirectory()
  return opfs.getDirectoryHandle(WEB_SANDBOX_ROOT, { create })
}

async function dirHandle(path: string, create: boolean): Promise<FileSystemDirectoryHandle> {
  let dir = await opfsRoot(create)
  for (const seg of segmentsOf(path)) {
    dir = await dir.getDirectoryHandle(seg, { create })
  }
  return dir
}

async function parentDir(
  path: string,
  create: boolean,
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
  const segs = segmentsOf(path)
  const name = segs.pop() ?? ''
  let dir = await opfsRoot(create)
  for (const seg of segs) {
    dir = await dir.getDirectoryHandle(seg, { create })
  }
  return { dir, name }
}

class OpfsFileSystemAdapter implements FileSystemPort {
  async exists(path: string): Promise<boolean> {
    try {
      const { dir, name } = await parentDir(path, false)
      try {
        await dir.getFileHandle(name, { create: false })
        return true
      } catch {
        await dir.getDirectoryHandle(name, { create: false })
        return true
      }
    } catch {
      return false
    }
  }

  async mkdir(path: string): Promise<void> {
    await dirHandle(path, true)
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { dir, name } = await parentDir(path, true)
    const file = await dir.getFileHandle(name, { create: true })
    const writable = await file.createWritable()
    try {
      // Copia con ArrayBuffer exacto: lib.dom exige ArrayBufferView<ArrayBuffer>.
      await writable.write(Uint8Array.from(data))
    } finally {
      await writable.close()
    }
  }

  async readFile(path: string): Promise<Uint8Array> {
    const { dir, name } = await parentDir(path, false)
    const file = await dir.getFileHandle(name, { create: false })
    const blob = await file.getFile()
    return new Uint8Array(await blob.arrayBuffer())
  }

  async rm(path: string): Promise<void> {
    try {
      const { dir, name } = await parentDir(path, false)
      await dir.removeEntry(name, { recursive: true })
    } catch {
      // no existe: rm es idempotente por contrato del puerto.
    }
  }

  async listDir(path: string): Promise<string[]> {
    const dir = await dirHandle(path, false)
    // values() falta en lib.dom de TS 5.9 (canonico del repo): cast estructural.
    const listable = dir as unknown as {
      values(): AsyncIterableIterator<{ kind: string; name: string }>
    }
    const names: string[] = []
    for await (const entry of listable.values()) {
      if (entry.kind === 'directory') names.push(entry.name)
    }
    return names.sort()
  }
}

type InitModule = (overrides?: {
  print?(...args: unknown[]): void
  printErr?(...args: unknown[]): void
  locateFile?(path: string): string
}) => Promise<Sqlite3Static>

let sqliteInit: Promise<Sqlite3Static> | null = null

async function sqlite(): Promise<Sqlite3Static> {
  sqliteInit ??= (async () => {
    // El wasm se empaqueta como asset (metro assetExts ya trae 'wasm');
    // locateFile evita que Emscripten lo busque junto al bundle.
    const [asset] = await Asset.loadAsync([
      require('@sqlite.org/sqlite-wasm/sqlite3.wasm') as number,
    ])
    const uri = asset.localUri ?? asset.uri
    return (sqlite3InitModule as InitModule)({
      print() {},
      printErr() {},
      locateFile: (path) => (path.endsWith('.wasm') ? uri : path),
    })
  })()
  return sqliteInit
}

function wrapDb(db: Database, sqlite3: Sqlite3Static): SqliteDb {
  const all = async <T>(sql: string, params?: ReadonlyArray<string | number | null>): Promise<T[]> => {
    const rows = db.exec({
      sql,
      bind: params !== undefined ? [...params] : undefined,
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as T[]
    return rows
  }
  return {
    get: async <T>(sql: string, params?: ReadonlyArray<string | number | null>) =>
      (await all<T>(sql, params))[0],
    all,
    exec: async (sql: string, params?: ReadonlyArray<string | number | null>) => {
      // DDL/DML sin filas: el mismo camino que las consultas (el probe hace
      // CREATE + INSERT con bind por aqui).
      db.exec({ sql, bind: params !== undefined ? [...params] : undefined })
    },
    // Memoria del hilo JS sobre bytes propios: cerrar es seguro (al contrario
    // que expo-sqlite ~56 en Android). El installer no cierra, pero openReadOnly
    // cachea por ruta asi que no hay duplicados por sesion.
    close: () => {
      db.close()
      return Promise.resolve()
    },
  }
}

const fs = new OpfsFileSystemAdapter()

class OfficialSqliteAdapter implements SqlitePort {
  private readonly cache = new Map<string, Promise<SqliteDb>>()

  async openReadOnly(path: string): Promise<SqliteDb> {
    const cached = this.cache.get(path)
    if (cached) return cached
    const opened = this.openFresh(path).catch((error: unknown) => {
      if (this.cache.get(path) === opened) this.cache.delete(path)
      throw error
    })
    this.cache.set(path, opened)
    return opened
  }

  private async openFresh(path: string): Promise<SqliteDb> {
    const sqlite3 = await sqlite()
    if (path === ':memory:') {
      return wrapDb(new sqlite3.oo1.DB(':memory:'), sqlite3)
    }
    const bytes = Uint8Array.from(await fs.readFile(path))
    const db = new sqlite3.oo1.DB(':memory:')
    if (db.pointer === undefined) {
      db.close()
      throw new Error(`sin puntero nativo para ${path}`)
    }
    const ptr = sqlite3.wasm.alloc(bytes.length)
    try {
      sqlite3.wasm.heap8u().set(bytes, ptr)
      const rc = sqlite3.capi.sqlite3_deserialize(
        db.pointer,
        'main',
        ptr,
        bytes.length,
        bytes.length,
        sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE,
      )
      if (rc !== 0) throw new Error(`sqlite3_deserialize rc=${String(rc)} para ${path}`)
    } catch (error) {
      sqlite3.wasm.dealloc(ptr)
      db.close()
      throw error
    }
    return wrapDb(db, sqlite3)
  }
}

/** Probe FTS5 sobre :memory: con el SQL compartido del engine. */
export async function probeFts5Support(): Promise<boolean> {
  try {
    const sqlite3 = await sqlite()
    const db = new sqlite3.oo1.DB(':memory:')
    try {
      return await runFts5Probe(wrapDb(db, sqlite3))
    } finally {
      db.close()
    }
  } catch {
    return false
  }
}

export function createEnginePorts(): EnginePorts {
  return {
    fs,
    crypto: createCryptoPort(),
    sqlite: new OfficialSqliteAdapter(),
    http: createHttpPort(),
  }
}
