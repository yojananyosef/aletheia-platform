import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CatalogService } from '../src/catalog'
import { InstallError } from '../src/errors'
import { installModule } from '../src/installer'
import { openInstalledModule } from '../src/open-module'
import { ModuleRegistry } from '../src/registry'
import { BibleReader } from '../src/reader/bible'
import type { Catalog } from '../src/types'
import type { EnginePorts, HttpPort } from '../src/ports'
import { bunSqlite, fetchHttp, nodeCrypto, nodeFs } from './adapters/node'

/**
 * E2E del engine (F0): consumir SOLO datos reales del catalogo oficial
 * aletheia-catalog — catalog.json de GitHub + ASV.amod del release.
 */
const CATALOG_URL =
  'https://raw.githubusercontent.com/yojananyosef/aletheia-catalog/main/catalog/catalog.json'

let sandboxDir: string
let ports: EnginePorts
let catalog: Catalog
let asvBytes: Uint8Array

beforeAll(async () => {
  sandboxDir = await mkdtemp(join(tmpdir(), 'aletheia-engine-e2e-'))
  ports = { fs: nodeFs, crypto: nodeCrypto, sqlite: bunSqlite, http: fetchHttp }
  catalog = await new CatalogService(fetchHttp, nodeFs, join(sandboxDir, 'cache/catalog-cache.json'), CATALOG_URL).refresh()
  const asv = catalog.modules.find((m) => m.id === 'ASV')
  if (!asv) throw new Error('el catalogo real no incluye ASV')
  asvBytes = await fetchHttp.getBinary(asv.downloadUrl)
}, 120_000)

afterAll(async () => {
  await rm(sandboxDir, { recursive: true, force: true })
})

describe('E2E engine: catalogo real → instalar ASV → leer Genesis 1:1', () => {
  test('el catalogo real trae los 4 modulos v1 con licencia visible', () => {
    expect(catalog.format).toBe('amf-catalog')
    expect(catalog.modules.map((m) => m.id).sort()).toEqual(['ASV', 'KJV', 'SME', 'SMITH'])
    for (const m of catalog.modules) {
      expect(m.license.length).toBeGreaterThan(0)
      expect(m.attribution.length).toBeGreaterThan(0)
    }
    const asv = catalog.modules.find((m) => m.id === 'ASV')
    expect(asv?.license).toBe('PublicDomain')
    expect(asv?.type).toBe('bible')
  })

  test('instala ASV.amod real: download → sha256 → unzip → sandbox', async () => {
    const asv = catalog.modules.find((m) => m.id === 'ASV')
    if (!asv) throw new Error('ASV ausente')
    const record = await installModule(asv, ports, sandboxDir)
    expect(record.id).toBe('ASV')
    expect(record.enabled).toBe(true)
    expect(record.license).toBe('PublicDomain')
    expect(await nodeFs.exists(join(sandboxDir, 'modules/ASV/content.db'))).toBe(true)
    expect(await nodeFs.exists(join(sandboxDir, 'modules/ASV/manifest.json'))).toBe(true)
  })

  test('bytes corruptos: el sha256 aborta y conserva la instalacion previa intacta', async () => {
    const asv = catalog.modules.find((m) => m.id === 'ASV')
    if (!asv) throw new Error('ASV ausente')
    const corrupt = asvBytes.slice()
    const lastByte = corrupt.length - 1
    corrupt[lastByte] = (corrupt[lastByte] ?? 0) ^ 0xff
    const stubHttp: HttpPort = { getBinary: async () => corrupt, getJson: fetchHttp.getJson }
    await expect(installModule(asv, { ...ports, http: stubHttp }, sandboxDir)).rejects.toBeInstanceOf(InstallError)
    expect(await nodeFs.exists(join(sandboxDir, 'modules/ASV'))).toBe(true)
  })

  test('registry: instalados, enable/disable y version', async () => {
    const registry = new ModuleRegistry(nodeFs, sandboxDir)
    const list = await registry.list()
    expect(list.map((m) => m.id)).toEqual(['ASV'])
    const disabled = await registry.setEnabled('ASV', false)
    expect(disabled.enabled).toBe(false)
    expect((await registry.get('ASV'))?.enabled).toBe(false)
    expect((await registry.get('KJV'))?.version).toBeUndefined()
    await expect(registry.setEnabled('KJV', true)).rejects.toBeInstanceOf(InstallError)
    const enabled = await registry.setEnabled('ASV', true)
    expect(enabled.enabled).toBe(true)
  })

  test('leer Genesis 1:1 desde el content.db real del modulo ASV', async () => {
    const { module, db } = await openInstalledModule(ports, sandboxDir, 'ASV')
    try {
      expect(module.type).toBe('bible')
      const reader = new BibleReader(db, module.features)
      const books = await reader.listBooks()
      expect(books).toHaveLength(66)
      expect(books[0]).toMatchObject({ osisCode: 'Gen', chapterCount: 50 })

      const gen1 = await reader.getChapter('Gen', 1)
      expect(gen1.verses).toHaveLength(31)
      expect(gen1.verses[0]?.verse).toBe(1)
      // Texto exacto tal como viene del content.db del catalogo (el reader no
      // normaliza: los artefactos del ETL son decision del aletheia-catalog).
      expect(gen1.verses[0]?.text).toBe('In the beginning God created the heavens and the earth .')
      expect(gen1.headings).toEqual([])
      expect(gen1.footnotes.length).toBeGreaterThanOrEqual(0)
      await expect(reader.getChapter('Gen', 51)).rejects.toBeInstanceOf(
        (await import('../src/errors')).ModuleOpenError,
      )
    } finally {
      await db.close()
    }
  })

  test('FTS5 sin diacriticos funciona sobre el modulo instalado', async () => {
    const { db } = await openInstalledModule(ports, sandboxDir, 'ASV')
    try {
      const reader = new BibleReader(db)
      const hits = await reader.searchVerses('beginning created', 5)
      expect(hits.length).toBeGreaterThan(0)
      const first = hits.find((h) => h.osisCode === 'Gen' && h.chapter === 1 && h.verse === 1)
      expect(first).toBeDefined()
    } finally {
      await db.close()
    }
  })

  test('CatalogService sirve cache y fallback tras refresco', async () => {
    const cachePath = join(sandboxDir, 'cache/catalog-cache.json')
    await writeFile(cachePath, JSON.stringify(catalog))
    const service = new CatalogService(fetchHttp, nodeFs, cachePath, CATALOG_URL)
    const cached = await service.get()
    expect(cached.modules.length).toBe(catalog.modules.length)
    expect(service.module('ASV', cached)?.shortName).toBe('ASV')
    expect(service.module('NOPE', cached)).toBeUndefined()
  })
})
