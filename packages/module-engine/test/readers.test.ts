import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'
import { CommentaryReader } from '../src/reader/commentary'
import { DevotionReader } from '../src/reader/devotion'
import { DictionaryReader } from '../src/reader/dictionary'
import { searchInstalledModules } from '../src/reader/search'
import type { InstalledModule } from '../src/types'
import { bunSqlite, nodeFs } from './adapters/node'

/**
 * Readers F4 sobre esquemas AMF v1 reales (commentary/dictionary/devotion/
 * bible minimos con FTS5 unicode61 remove_diacritics 2, igual que el builder
 * del catalogo). Sin red.
 */
let dir: string

function bibleDb(path: string): void {
  const db = new Database(path)
  db.exec(`CREATE TABLE books (bookId INTEGER PRIMARY KEY, osisCode TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    abbreviation TEXT NOT NULL, testament TEXT NOT NULL, bookOrder INTEGER NOT NULL, chapterCount INTEGER NOT NULL) WITHOUT ROWID;
    INSERT INTO books VALUES (1, 'Gen', 'Genesis', 'Gen', 'OT', 1, 50);
    CREATE TABLE verses (bookId INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, verseEnd INTEGER, text TEXT NOT NULL, UNIQUE (bookId, chapter, verse));
    INSERT INTO verses VALUES (1, 1, 1, NULL, 'In the beginning God created the heavens and the earth.'), (1, 1, 2, NULL, 'And the earth was waste and void.');
    CREATE VIRTUAL TABLE verses_fts USING fts5(text, bookId UNINDEXED, chapter UNINDEXED, verse UNINDEXED, verseEnd UNINDEXED, content='verses', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
    CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN INSERT INTO verses_fts(rowid, text, bookId, chapter, verse, verseEnd) VALUES (new.rowid, new.text, new.bookId, new.chapter, new.verse, new.verseEnd); END;
    INSERT INTO verses VALUES (1, 1, 3, NULL, 'Jesús es la luz del mundo.');
    PRAGMA application_id = 0x414D4F44; PRAGMA user_version = 1;`)
  db.close()
}

function commentaryDb(path: string): void {
  const db = new Database(path)
  db.exec(`CREATE TABLE books (bookId INTEGER PRIMARY KEY, osisCode TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    abbreviation TEXT NOT NULL, testament TEXT NOT NULL, bookOrder INTEGER NOT NULL, chapterCount INTEGER NOT NULL) WITHOUT ROWID;
    INSERT INTO books VALUES (1, 'Gen', 'Genesis', 'Gen', 'OT', 1, 50), (2, 'Exod', 'Exodus', 'Exod', 'OT', 2, 40);
    CREATE TABLE entries (bookId INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL, UNIQUE (bookId, chapter, verse));
    CREATE VIRTUAL TABLE entries_fts USING fts5(text, bookId UNINDEXED, chapter UNINDEXED, verse UNINDEXED, content='entries', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
    CREATE TRIGGER entries_ai AFTER INSERT ON entries BEGIN INSERT INTO entries_fts(rowid, text, bookId, chapter, verse) VALUES (new.rowid, new.text, new.bookId, new.chapter, new.verse); END;
    INSERT INTO entries VALUES (1, 1, 1, 'In the beginning: God alone is eternal, showing grace.'), (1, 1, 2, 'Without form and void: chaos ordered by the Spirit.'), (2, 3, 14, 'I AM THAT I AM: the covenant name.');
    PRAGMA application_id = 0x414D4F44; PRAGMA user_version = 1;`)
  db.close()
}

function dictionaryDb(path: string): void {
  const db = new Database(path)
  db.exec(`CREATE TABLE entries (key TEXT PRIMARY KEY, sortKey TEXT NOT NULL, strongs TEXT, content TEXT NOT NULL, UNIQUE (sortKey, key));
    CREATE VIRTUAL TABLE entries_fts USING fts5(content, content='entries', content_rowid='rowid', tokenize='unicode61 remove_diacritics 2');
    CREATE TRIGGER entries_ai AFTER INSERT ON entries BEGIN INSERT INTO entries_fts(rowid, content) VALUES (new.rowid, new.content); END;
    INSERT INTO entries VALUES ('AARON', 'aaron', NULL, 'Brother of Moses, first high priest.'), ('GRACE', 'grace', NULL, 'Unmerited favor of God toward sinners.'), ('G3056', 'g3056', 'G3056', 'logos: word, speech, divine Word.'), ('ÁRBOL', 'arbol', NULL, 'Tree mentioned in parables.');
    PRAGMA application_id = 0x414D4F44; PRAGMA user_version = 1;`)
  db.close()
}

function devotionDb(path: string): void {
  const db = new Database(path)
  db.exec(`CREATE TABLE entries (month INTEGER NOT NULL, day INTEGER NOT NULL, title TEXT NOT NULL, scripture TEXT, content TEXT NOT NULL, PRIMARY KEY (month, day)) WITHOUT ROWID;
    INSERT INTO entries VALUES (1, 1, '01.01', 'Joshua 5:12', 'They did eat of the fruit of the land.'), (12, 31, '12.31', NULL, 'The year ends in grace.');
    PRAGMA application_id = 0x414D4F44; PRAGMA user_version = 1;`)
  db.close()
}

function record(id: string, type: InstalledModule['type'], name: string): InstalledModule {
  return {
    id, type, name, shortName: id, language: 'en', version: '1.0.0',
    license: 'PublicDomain', attribution: `${name}, Public Domain`, copyright: `${name}, Public Domain`,
    features: { hasStrongs: false, hasMorphology: false, hasFootnotes: false, hasHeadings: false },
    schemaVersion: 1, minReaderVersion: 1, installedAt: new Date().toISOString(), enabled: true,
  }
}

async function installFake(id: string, type: InstalledModule['type'], build: (p: string) => void): Promise<void> {
  const moduleDir = join(dir, 'modules', id)
  await nodeFs.mkdir(moduleDir)
  build(join(moduleDir, 'content.db'))
  const rec = record(id, type, `${id} test`)
  await nodeFs.writeFile(join(moduleDir, 'installed.json'), new TextEncoder().encode(JSON.stringify(rec)))
}

const ports = { fs: nodeFs, crypto: null as never, sqlite: bunSqlite, http: null as never }

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'aletheia-readers-'))
  await installFake('BIBLE', 'bible', bibleDb)
  await installFake('COMM', 'commentary', commentaryDb)
  await installFake('DICT', 'dictionary', dictionaryDb)
  await installFake('DEV', 'devotion', devotionDb)
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function openDb(id: string) {
  return bunSqlite.openReadOnly(join(dir, 'modules', id, 'content.db'))
}

describe('CommentaryReader', () => {
  test('getEntry devuelve el comentario real del versiculo; undefined si no lo cubre', async () => {
    const db = await openDb('COMM')
    try {
      const reader = new CommentaryReader(db)
      expect((await reader.getEntry('Gen', 1, 1))?.text).toContain('eternal')
      expect(await reader.getEntry('Gen', 1, 99)).toBeUndefined()
      expect(await reader.getEntry('Rev', 22, 21)).toBeUndefined()
    } finally {
      await db.close()
    }
  })

  test('getChapterEntries sincroniza el capitulo en orden', async () => {
    const db = await openDb('COMM')
    try {
      const entries = await new CommentaryReader(db).getChapterEntries('Gen', 1)
      expect(entries.map((e) => e.verse)).toEqual([1, 2])
      expect(entries[0]?.bookName).toBe('Genesis')
    } finally {
      await db.close()
    }
  })

  test('searchEntries FTS5 sin diacriticos', async () => {
    const db = await openDb('COMM')
    try {
      const hits = await new CommentaryReader(db).searchEntries('grace', 10)
      expect(hits.length).toBeGreaterThanOrEqual(1)
      expect(hits[0]).toMatchObject({ osisCode: 'Gen', chapter: 1, verse: 1 })
    } finally {
      await db.close()
    }
  })
})

describe('DictionaryReader', () => {
  test('lookup exacto + insensible a mayusculas + fallback sortKey sin acentos', async () => {
    const db = await openDb('DICT')
    try {
      const reader = new DictionaryReader(db)
      expect((await reader.lookup('AARON'))?.content).toContain('Moses')
      expect((await reader.lookup('aaron'))?.key).toBe('AARON')
      expect((await reader.lookup('arbol'))?.key).toBe('ÁRBOL')
      expect(await reader.lookup('NOEXISTE')).toBeUndefined()
      expect(await reader.lookup('  ')).toBeUndefined()
    } finally {
      await db.close()
    }
  })

  test('lookupPrefix autocompleta ordenado; getByStrongs resuelve el lexico', async () => {
    const db = await openDb('DICT')
    try {
      const reader = new DictionaryReader(db)
      const prefixed = await reader.lookupPrefix('a', 10)
      expect(prefixed.map((e) => e.key)).toContain('AARON')
      expect(await reader.lookupPrefix('', 10)).toEqual([])
      expect((await reader.getByStrongs('g3056'))[0]?.key).toBe('G3056')
      expect(await reader.getByStrongs('H9999')).toEqual([])
    } finally {
      await db.close()
    }
  })

  test('searchEntries FTS5 sobre el contenido', async () => {
    const db = await openDb('DICT')
    try {
      const hits = await new DictionaryReader(db).searchEntries('priest', 10)
      expect(hits.map((h) => h.key)).toContain('AARON')
      expect(await new DictionaryReader(db).count()).toBe(4)
    } finally {
      await db.close()
    }
  })
})

describe('DevotionReader', () => {
  test('getDay devuelve el devocional; listDays indexa el año en orden', async () => {
    const db = await openDb('DEV')
    try {
      const reader = new DevotionReader(db)
      const jan1 = await reader.getDay(1, 1)
      expect(jan1?.content).toContain('fruit of the land')
      expect(jan1?.scripture).toBe('Joshua 5:12')
      expect(await reader.getDay(2, 30)).toBeUndefined()
      const days = await reader.listDays()
      expect(days).toEqual([
        { month: 1, day: 1, title: '01.01' },
        { month: 12, day: 31, title: '12.31' },
      ])
    } finally {
      await db.close()
    }
  })
})

describe('searchInstalledModules', () => {
  test('agrupa Biblia + comentario + diccionario con atribucion de modulo', async () => {
    const { ModuleRegistry } = await import('../src/registry')
    const installed = await new ModuleRegistry(nodeFs, dir).list()
    const res = await searchInstalledModules(ports, dir, installed, 'grace', { limitPerModule: 10 })
    expect(res.query).toBe('grace')
    expect(res.commentaries.map((h) => `${h.moduleId} ${h.osisCode} ${h.chapter}:${h.verse}`)).toContain(
      'COMM Gen 1:1',
    )
    expect(res.dictionaries.map((h) => `${h.moduleId}:${h.key}`)).toContain('DICT:GRACE')
  })

  test('query vacia no toca disco; sintaxis MATCH invalida no rompe', async () => {
    const { ModuleRegistry } = await import('../src/registry')
    const installed = await new ModuleRegistry(nodeFs, dir).list()
    const empty = await searchInstalledModules(ports, dir, installed, '   ')
    expect(empty).toEqual({ query: '', bibles: [], commentaries: [], dictionaries: [], errors: [] })
    const bad = await searchInstalledModules(ports, dir, installed, 'AND OR (', { limitPerModule: 5 })
    expect(bad.bibles).toEqual([])
    expect(bad.commentaries).toEqual([])
    expect(bad.dictionaries).toEqual([])
  })

  test('modulos deshabilitados y devotion se excluyen del FTS global', async () => {    const { ModuleRegistry } = await import('../src/registry')
    const registry = new ModuleRegistry(nodeFs, dir)
    await registry.setEnabled('DICT', false)
    const installed = await registry.list()
    const res = await searchInstalledModules(ports, dir, installed, 'grace', { limitPerModule: 10 })
    expect(res.dictionaries).toEqual([])
    expect(res.commentaries.length).toBeGreaterThan(0)
    await registry.setEnabled('DICT', true)
  })

  test('modulo danado se reporta en errors en vez de un 0 mudo', async () => {
    const moduleDir = join(dir, 'modules', 'BROKEN')
    await nodeFs.mkdir(moduleDir)
    await nodeFs.writeFile(join(moduleDir, 'content.db'), new TextEncoder().encode('no-es-sqlite'))
    await nodeFs.writeFile(
      join(moduleDir, 'installed.json'),
      new TextEncoder().encode(JSON.stringify(record('BROKEN', 'bible', 'Broken test'))),
    )
    const { ModuleRegistry } = await import('../src/registry')
    const installed = await new ModuleRegistry(nodeFs, dir).list()
    const res = await searchInstalledModules(ports, dir, installed, 'grace', { limitPerModule: 10 })
    expect(res.errors.map((e) => e.moduleId)).toContain('BROKEN')
    expect(res.errors.find((e) => e.moduleId === 'BROKEN')?.message.length).toBeGreaterThan(0)
    // Los sanos siguen respondiendo.
    expect(res.commentaries.length).toBeGreaterThan(0)
  })
})
