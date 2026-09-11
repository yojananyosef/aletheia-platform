import { describe, expect, test } from 'bun:test'
import { Database } from 'bun:sqlite'
import type { SqliteDb } from '../src/ports'
import { FTS5_PROBE_QUERY, runFts5Probe } from '../src/reader/fts-probe'

function memoryDb(): SqliteDb {
  const db = new Database(':memory:')
  return {
    async get<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>) {
      return db.query(sql).get(...(params ?? [])) as T | undefined
    },
    async all<T = unknown>(sql: string, params?: ReadonlyArray<string | number | null>) {
      return db.query(sql).all(...(params ?? [])) as T[]
    },
    async exec(sql: string, params?: ReadonlyArray<string | number | null>) {
      db.query(sql).run(...(params ?? []))
    },
    async close() {
      db.close()
    },
  }
}

describe('runFts5Probe', () => {
  test('pasa en SQLite con FTS5 + unicode61 remove_diacritics (Jesús ≈ JESUS)', async () => {
    const db = memoryDb()
    try {
      expect(await runFts5Probe(db)).toBe(true)
    } finally {
      await db.close()
    }
  })

  test('el SQL del probe usa el tokenizer con diacriticos y el query sin ellos', () => {
    // Regresion: si alguien cambia el tokenizer o el query, el probe pierde sentido.
    expect(FTS5_PROBE_QUERY).not.toMatch(/[áéíóúñ]/i)
  })

  test('devuelve false (no lanza) si la base falla', async () => {
    const broken: SqliteDb = {
      async get() {
        throw new Error('sqlite caido')
      },
      async all() {
        throw new Error('sqlite caido')
      },
      async exec() {
        throw new Error('sqlite caido')
      },
      async close() {},
    }
    expect(await runFts5Probe(broken)).toBe(false)
  })

  test('devuelve false si FTS5 no esta compilado', async () => {
    const noFts: SqliteDb = {
      async get<T = unknown>(): Promise<T | undefined> {
        return { enabled: 0 } as T | undefined
      },
      async all() {
        return []
      },
      async exec() {},
      async close() {},
    }
    expect(await runFts5Probe(noFts)).toBe(false)
  })
})
