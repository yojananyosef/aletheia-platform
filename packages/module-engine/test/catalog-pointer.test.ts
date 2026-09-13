import { describe, expect, test } from 'bun:test'

import { CatalogService, DEFAULT_CATALOG_URL, LATEST_POINTER_URL } from '../src/catalog'
import type { FileSystemPort, HttpPort } from '../src/ports'

/**
 * Puntero latest (F5): la app resuelve siempre la ultima version publicada
 * con fallback silencioso al pin si el puntero falla.
 */
const PIN_URL = DEFAULT_CATALOG_URL
const POINTER_URL = LATEST_POINTER_URL
const LATEST_CATALOG_URL = 'https://raw.githubusercontent.com/yojananyosef/aletheia-catalog/v9.9.9/catalog/catalog.json'

function memFs(): FileSystemPort {
  const files = new Map<string, Uint8Array>()
  return {
    exists: async (p) => files.has(p),
    mkdir: async () => {},
    writeFile: async (p, d) => {
      files.set(p, d)
    },
    readFile: async (p) => {
      const f = files.get(p)
      if (!f) throw new Error(`no existe: ${p}`)
      return f
    },
    rm: async (p) => {
      files.delete(p)
    },
    listDir: async () => [],
  }
}

function stubHttp(routes: Record<string, unknown>, failOn: string[] = [], calls: string[] = []): HttpPort {
  return {
    getBinary: async () => {
      throw new Error('no usado')
    },
    getJson: async <T>(url: string): Promise<T> => {
      calls.push(url)
      if (failOn.includes(url)) throw new Error(`red caida: ${url}`)
      if (!(url in routes)) throw new Error(`404: ${url}`)
      return routes[url] as T
    },
  }
}

function minimalCatalog(): Record<string, unknown> {
  return {
    format: 'amf-catalog',
    version: 1,
    generatedAt: '2026-09-13',
    releaseBase: 'https://raw.githubusercontent.com/yojananyosef/aletheia-catalog/v1.3.0/dist',
    modules: [],
  }
}

const POINTER = {
  format: 'amf-latest-pointer',
  version: '9.9.9',
  tag: 'v9.9.9',
  catalogUrl: LATEST_CATALOG_URL,
}

describe('puntero latest del catalogo', () => {
  test('resuelve a la ultima version cuando el puntero responde', async () => {
    const calls: string[] = []
    const svc = new CatalogService(
      stubHttp({ [POINTER_URL]: POINTER, [LATEST_CATALOG_URL]: minimalCatalog() }, [], calls),
      memFs(),
      '/cache/catalog-cache.json',
      PIN_URL,
      POINTER_URL,
    )
    const catalog = await svc.refresh()
    expect(catalog.releaseBase).toContain('v1.3.0')
    expect(calls).toEqual([POINTER_URL, LATEST_CATALOG_URL])
  })

  test('puntero caido: usa el pin sin ruido', async () => {
    const calls: string[] = []
    const svc = new CatalogService(
      stubHttp({ [PIN_URL]: minimalCatalog() }, [POINTER_URL], calls),
      memFs(),
      '/cache/catalog-cache.json',
      PIN_URL,
      POINTER_URL,
    )
    const catalog = await svc.refresh()
    expect(catalog.releaseBase).toContain('v1.3.0')
    expect(calls).toEqual([POINTER_URL, PIN_URL])
  })

  test('puntero con formato desconocido o host extrano: usa el pin', async () => {
    for (const bad of [
      { format: 'otro-formato', catalogUrl: LATEST_CATALOG_URL },
      { format: 'amf-latest-pointer', catalogUrl: 'https://evil.example.com/catalog.json' },
      { format: 'amf-latest-pointer', catalogUrl: 'https://github.com/yojananyosef/aletheia-catalog/releases/latest/download/x' },
      null,
    ]) {
      const calls: string[] = []
      const svc = new CatalogService(
        stubHttp({ [POINTER_URL]: bad, [PIN_URL]: minimalCatalog() }, [], calls),
        memFs(),
        '/cache/catalog-cache.json',
        PIN_URL,
        POINTER_URL,
      )
      const catalog = await svc.refresh()
      expect(catalog.releaseBase).toContain('v1.3.0')
      expect(calls).toEqual([POINTER_URL, PIN_URL])
    }
  })

  test('catalogo latest corrupto: reintenta con el pin', async () => {
    const calls: string[] = []
    const svc = new CatalogService(
      stubHttp({ [POINTER_URL]: POINTER, [LATEST_CATALOG_URL]: { roto: true }, [PIN_URL]: minimalCatalog() }, [], calls),
      memFs(),
      '/cache/catalog-cache.json',
      PIN_URL,
      POINTER_URL,
    )
    const catalog = await svc.refresh()
    expect(catalog.releaseBase).toContain('v1.3.0')
    expect(calls).toEqual([POINTER_URL, LATEST_CATALOG_URL, PIN_URL])
  })

  test('sin puntero (null): va directo al pin', async () => {
    const calls: string[] = []
    const svc = new CatalogService(
      stubHttp({ [PIN_URL]: minimalCatalog() }, [], calls),
      memFs(),
      '/cache/catalog-cache.json',
      PIN_URL,
      null,
    )
    await svc.refresh()
    expect(calls).toEqual([PIN_URL])
  })
})
