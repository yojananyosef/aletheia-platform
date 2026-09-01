import * as Crypto from 'expo-crypto'
import { Directory, File } from 'expo-file-system'
import { openDatabaseAsync, type SQLiteBindParams, type SQLiteDatabase } from 'expo-sqlite'

import type {
  CryptoPort,
  EnginePorts,
  FileSystemPort,
  HttpPort,
  SqliteDb,
  SqlitePort,
} from '@aletheia/module-engine'

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

class ExpoCryptoAdapter implements CryptoPort {
  async sha256Hex(data: Uint8Array): Promise<string> {
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(data))
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
}

class ExpoSqliteAdapter implements SqlitePort {
  async openReadOnly(path: string): Promise<SqliteDb> {
    const dir = path.slice(0, path.lastIndexOf('/'))
    const name = path.slice(path.lastIndexOf('/') + 1)
    const db: SQLiteDatabase = await openDatabaseAsync(name, undefined, dir)
    return {
      get: async <T>(sql: string, params?: ReadonlyArray<string | number | null>) =>
        (await db.getFirstAsync<T>(sql, params as SQLiteBindParams)) ?? undefined,
      all: async <T>(sql: string, params?: ReadonlyArray<string | number | null>) =>
        await db.getAllAsync<T>(sql, params as SQLiteBindParams),
      close: () => db.closeAsync(),
    }
  }
}

const fetchHttp: HttpPort = {
  async getBinary(url: string): Promise<Uint8Array> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${String(res.status)} descargando ${url}`)
    return new Uint8Array(await res.arrayBuffer())
  },
  async getJson<T>(url: string): Promise<T> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${String(res.status)} descargando ${url}`)
    return (await res.json()) as T
  },
}

export function createEnginePorts(): EnginePorts {
  return {
    fs: new ExpoFileSystemAdapter(),
    crypto: new ExpoCryptoAdapter(),
    sqlite: new ExpoSqliteAdapter(),
    http: fetchHttp,
  }
}
