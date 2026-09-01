import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { Database } from 'bun:sqlite'
import type { CryptoPort, FileSystemPort, HttpPort, SqliteDb, SqlitePort } from '../../src/ports'

export const nodeFs: FileSystemPort = {
  async exists(path) {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  },
  async mkdir(path) {
    await mkdir(path, { recursive: true })
  },
  async writeFile(path, data) {
    await writeFile(path, data)
  },
  async readFile(path) {
    const buf = await readFile(path)
    return new Uint8Array(buf)
  },
  async rm(path) {
    await rm(path, { recursive: true, force: true })
  },
  async listDir(path) {
    const entries = await readdir(path, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  },
}

export const nodeCrypto: CryptoPort = {
  async sha256Hex(data) {
    return createHash('sha256').update(data).digest('hex')
  },
}

/** bun:sqlite (SQLite con FTS5 embebido en Bun) sobre el content.db instalado. */
export const bunSqlite: SqlitePort = {
  async openReadOnly(path) {
    const db = new Database(path, { readonly: true })
    const dbPort: SqliteDb = {
      async get<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>) {
        return db.query(sql).get(...(params ?? [])) as T | undefined
      },
      async all<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>) {
        return db.query(sql).all(...(params ?? [])) as T[]
      },
      async close() {
        db.close()
      },
    }
    return dbPort
  },
}

export const fetchHttp: HttpPort = {
  async getBinary(url) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET ${url} -> ${String(res.status)}`)
    return new Uint8Array(await res.arrayBuffer())
  },
  async getJson<T>(url: string) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET ${url} -> ${String(res.status)}`)
    return (await res.json()) as T
  },
}
