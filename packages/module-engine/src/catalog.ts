import { CatalogError } from './errors'
import type { FileSystemPort, HttpPort } from './ports'
import type { Catalog, CatalogModule, ModuleType } from './types'

export const DEFAULT_CATALOG_URL =
  'https://raw.githubusercontent.com/yojananyosef/aletheia-catalog/main/catalog/catalog.json'

const MODULE_TYPES: readonly ModuleType[] = [
  'bible',
  'commentary',
  'lexicon',
  'dictionary',
  'crossref',
  'devotion',
]

const SHA256_RE = /^[0-9a-f]{64}$/

/** Valida la estructura del catalogo; ignora campos desconocidos (evolucion compatible). */
export function validateCatalog(raw: unknown): Catalog {
  if (typeof raw !== 'object' || raw === null) throw new CatalogError('catalogo: JSON invalido')
  const c = raw as Record<string, unknown>
  if (c.format !== 'amf-catalog') throw new CatalogError('catalogo: format inesperado')
  if (typeof c.version !== 'number') throw new CatalogError('catalogo: version ausente')
  if (!Array.isArray(c.modules)) throw new CatalogError('catalogo: modules ausente')
  const modules = c.modules.map((m, i): CatalogModule => {
    if (typeof m !== 'object' || m === null) throw new CatalogError(`catalogo: modules[${i}] invalido`)
    const e = m as Record<string, unknown>
    const req = (k: string, type: string): unknown => {
      const v = e[k]
      if (typeof v !== type || (type === 'string' && (v as string).length === 0)) {
        throw new CatalogError(`catalogo: modules[${i}].${k} invalido`)
      }
      return v
    }
    const type = req('type', 'string') as ModuleType
    if (!MODULE_TYPES.includes(type)) throw new CatalogError(`catalogo: modules[${i}].type desconocido`)
    const sha256 = req('sha256', 'string') as string
    if (!SHA256_RE.test(sha256)) throw new CatalogError(`catalogo: modules[${i}].sha256 invalido`)
    const features = e.features
    if (typeof features !== 'object' || features === null) {
      throw new CatalogError(`catalogo: modules[${i}].features invalido`)
    }
    const f = features as Record<string, unknown>
    return {
      id: req('id', 'string') as string,
      type,
      name: req('name', 'string') as string,
      shortName: req('shortName', 'string') as string,
      language: req('language', 'string') as string,
      version: req('version', 'string') as string,
      publisher: req('publisher', 'string') as string,
      license: req('license', 'string') as string,
      copyright: req('copyright', 'string') as string,
      attribution: req('attribution', 'string') as string,
      features: {
        hasStrongs: f.hasStrongs === true,
        hasMorphology: f.hasMorphology === true,
        hasFootnotes: f.hasFootnotes === true,
        hasHeadings: f.hasHeadings === true,
      },
      amf: req('amf', 'number') as number,
      schemaVersion: req('schemaVersion', 'number') as number,
      minReaderVersion: req('minReaderVersion', 'number') as number,
      sizeBytes: req('sizeBytes', 'number') as number,
      sha256,
      downloadUrl: req('downloadUrl', 'string') as string,
    }
  })
  return {
    format: 'amf-catalog',
    version: c.version,
    generatedAt: typeof c.generatedAt === 'string' ? c.generatedAt : '',
    releaseBase: typeof c.releaseBase === 'string' ? c.releaseBase : '',
    modules,
  }
}

/**
 * Catalogo oficial con cache local en el sandbox: `get()` sirve el cache y solo
 * descarga si no existe; `refresh()` fuerza re-descarga (pull-to-refresh de la UI).
 */
export class CatalogService {
  constructor(
    private readonly http: HttpPort,
    private readonly fs: FileSystemPort,
    private readonly cachePath: string,
    private readonly url: string = DEFAULT_CATALOG_URL,
  ) {}

  async get(): Promise<Catalog> {
    if (await this.fs.exists(this.cachePath)) {
      try {
        return validateCatalog(JSON.parse(new TextDecoder().decode(await this.fs.readFile(this.cachePath))))
      } catch (error) {
        if (error instanceof CatalogError) throw error
        // cache corrupto: continuar con re-descarga
      }
    }
    return this.refresh()
  }

  async refresh(): Promise<Catalog> {
    const raw = await this.http.getJson<unknown>(this.url)
    const catalog = validateCatalog(raw)
    await this.fs.mkdir(dirname(this.cachePath))
    await this.fs.writeFile(this.cachePath, new TextEncoder().encode(JSON.stringify(catalog)))
    return catalog
  }

  module(id: string, catalog: Catalog): CatalogModule | undefined {
    return catalog.modules.find((m) => m.id === id)
  }
}

function dirname(path: string): string {
  const i = path.lastIndexOf('/')
  return i > 0 ? path.slice(0, i) : path
}
