/** Tipos del catalogo oficial (catalog.json de aletheia-catalog). */

export type ModuleType = 'bible' | 'commentary' | 'lexicon' | 'dictionary' | 'crossref' | 'devotion'

export interface ModuleFeatures {
  hasStrongs: boolean
  hasMorphology: boolean
  hasFootnotes: boolean
  hasHeadings: boolean
}

/** Entrada de catalog.json (fuente unica de contenido). */
export interface CatalogModule {
  id: string
  type: ModuleType
  name: string
  shortName: string
  language: string
  version: string
  publisher: string
  license: string
  copyright: string
  attribution: string
  source?: string
  features: ModuleFeatures
  amf: number
  schemaVersion: number
  minReaderVersion: number
  sizeBytes: number
  sha256: string
  downloadUrl: string
  buildTool?: string
}

export interface Catalog {
  format: 'amf-catalog'
  version: number
  generatedAt: string
  releaseBase: string
  modules: CatalogModule[]
}

/** manifest.json embebido en el .amod (AMF v1). */
export interface ModuleManifest {
  amf: number
  schemaVersion: number
  minReaderVersion: number
  id: string
  type: ModuleType
  name: string
  shortName: string
  language: string
  direction: 'ltr' | 'rtl'
  version: string
  publisher: string
  license: string
  copyright: string
  source?: string
  attribution: string
  features: Partial<ModuleFeatures>
  dependencies: unknown[]
}

/** Registro de un modulo instalado en el sandbox (installed.json). */
export interface InstalledModule {
  id: string
  type: ModuleType
  name: string
  shortName: string
  language: string
  version: string
  license: string
  attribution: string
  copyright: string
  features: ModuleFeatures
  schemaVersion: number
  minReaderVersion: number
  installedAt: string
  enabled: boolean
}
