import { unzip } from 'fflate'
import { CatalogError, InstallError, ModuleOpenError } from './errors'
import type { EnginePorts } from './ports'
import type { CatalogModule, InstalledModule, ModuleManifest } from './types'

/** application_id 0x414D4F44 "AMOD" del formato (AMF-SPEC §3). */
export const AMOD_APPLICATION_ID = 0x414d4f44
/** Version maxima de esquema que este reader sabe leer. */
export const READER_SCHEMA_VERSION = 1
/** Version del reader (contra minReaderVersion del modulo). */
export const READER_VERSION = 1

export interface InstallPaths {
  modulesDir: string
  moduleDir: string
  dbPath: string
  manifestPath: string
  recordPath: string
}

export function installPaths(sandboxDir: string, moduleId: string): InstallPaths {
  const modulesDir = `${sandboxDir}/modules`
  const moduleDir = `${modulesDir}/${moduleId}`
  return {
    modulesDir,
    moduleDir,
    dbPath: `${moduleDir}/content.db`,
    manifestPath: `${moduleDir}/manifest.json`,
    recordPath: `${moduleDir}/installed.json`,
  }
}

/** Valida el application_id y user_version del content.db abierto (AMF-SPEC §3). */
export async function validateAmodDb(
  db: import('./ports').SqliteDb,
  expectedSchemaVersion?: number,
): Promise<void> {
  const appIdRow = await db.get<{ application_id: number }>('PRAGMA application_id')
  const versionRow = await db.get<{ user_version: number }>('PRAGMA user_version')
  if (!appIdRow || appIdRow.application_id !== AMOD_APPLICATION_ID) {
    throw new ModuleOpenError('content.db: application_id no es AMOD (modulo corrupto o invalido)')
  }
  const schemaVersion = versionRow?.user_version
  if (schemaVersion === undefined || !Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new ModuleOpenError(`content.db: user_version invalido (${String(schemaVersion)})`)
  }
  if (schemaVersion > READER_SCHEMA_VERSION) {
    throw new ModuleOpenError('content.db: schemaVersion mas nueva que este reader; actualiza la app')
  }
  if (expectedSchemaVersion !== undefined && schemaVersion !== expectedSchemaVersion) {
    throw new ModuleOpenError('content.db: schemaVersion no coincide con el manifest')
  }
}

export function validateManifest(raw: unknown, expected: CatalogModule): ModuleManifest {
  if (typeof raw !== 'object' || raw === null) throw new InstallError('manifest.json invalido')
  const m = raw as Record<string, unknown>
  const req = (k: string): unknown => {
    if (m[k] === undefined || m[k] === null) throw new InstallError(`manifest: ${k} ausente`)
    return m[k]
  }
  if (m.amf !== 1) throw new InstallError('manifest: amf != 1 (formato no soportado)')
  const id = req('id')
  const version = req('version')
  if (id !== expected.id) throw new InstallError(`manifest: id ${String(id)} != catalogo ${expected.id}`)
  if (version !== expected.version) {
    throw new InstallError(`manifest: version ${String(version)} != catalogo ${expected.version}`)
  }
  const license = req('license')
  if (typeof license !== 'string' || license.length === 0) {
    throw new InstallError('manifest: license obligatoria')
  }
  const schemaVersion = req('schemaVersion')
  const minReaderVersion = req('minReaderVersion')
  if (typeof schemaVersion !== 'number' || schemaVersion < 1) {
    throw new InstallError('manifest: schemaVersion invalida')
  }
  if (schemaVersion > READER_SCHEMA_VERSION) {
    throw new InstallError('manifest: schemaVersion mas nueva que este reader; actualiza la app')
  }
  if (typeof minReaderVersion !== 'number' || minReaderVersion > READER_VERSION) {
    throw new InstallError('manifest: requiere un reader mas nuevo; actualiza la app')
  }
  return m as unknown as ModuleManifest
}

async function unzipAmod(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(bytes, (err, data) => (err ? reject(err) : resolve(data)))
  })
  const out = new Map<string, Uint8Array>()
  for (const [name, data] of Object.entries(entries)) {
    if (name.endsWith('/')) continue
    out.set(name, data)
  }
  const manifest = out.get('manifest.json')
  const content = out.get('content.db')
  if (!manifest || !content) {
    throw new InstallError('.amod invalido: faltan manifest.json o content.db (AMF-SPEC §1)')
  }
  return out
}

/**
 * Flujo del AMF-SPEC §5.3: download → sha256 contra el catalogo → unzip → sandbox
 * → validacion del content.db (application_id + schemaVersion) → installed.json.
 * Aborta con InstallError y limpia el modulo parcial si algo falla.
 */
export async function installModule(module: CatalogModule, ports: EnginePorts, sandboxDir: string): Promise<InstalledModule> {
  const paths = installPaths(sandboxDir, module.id)
  await ports.fs.mkdir(paths.modulesDir)
  // El modulo en disco solo se toca despues de validar sha256 + manifest: un fallo
  // temprano nunca destruye una instalacion previa del mismo modulo.
  let touchedModuleDir = false
  try {
    const bytes = await ports.http.getBinary(module.downloadUrl)
    const sha256 = await ports.crypto.sha256Hex(bytes)
    if (sha256 !== module.sha256.toLowerCase()) {
      throw new InstallError(`sha256 no coincide con el catalogo para ${module.id}: descarga abortada`)
    }
    const entries = await unzipAmod(bytes)
    const manifestRaw: unknown = JSON.parse(new TextDecoder().decode(entries.get('manifest.json')))
    const manifest = validateManifest(manifestRaw, module)

    await ports.fs.mkdir(paths.moduleDir)
    touchedModuleDir = true
    await ports.fs.writeFile(paths.manifestPath, entries.get('manifest.json') as Uint8Array)
    await ports.fs.writeFile(paths.dbPath, entries.get('content.db') as Uint8Array)

    const db = await ports.sqlite.openReadOnly(paths.dbPath)
    try {
      await validateAmodDb(db, manifest.schemaVersion)
    } finally {
      await db.close()
    }

    const record: InstalledModule = {
      id: manifest.id,
      type: manifest.type,
      name: manifest.name,
      shortName: manifest.shortName,
      language: manifest.language,
      version: manifest.version,
      license: manifest.license,
      attribution: manifest.attribution,
      copyright: manifest.copyright,
      features: {
        hasStrongs: manifest.features.hasStrongs === true,
        hasMorphology: manifest.features.hasMorphology === true,
        hasFootnotes: manifest.features.hasFootnotes === true,
        hasHeadings: manifest.features.hasHeadings === true,
      },
      schemaVersion: manifest.schemaVersion,
      minReaderVersion: manifest.minReaderVersion,
      installedAt: new Date().toISOString(),
      enabled: true,
    }
    await ports.fs.writeFile(paths.recordPath, new TextEncoder().encode(JSON.stringify(record)))
    return record
  } catch (error) {
    if (touchedModuleDir) await ports.fs.rm(paths.moduleDir).catch(() => {})
    if (error instanceof InstallError || error instanceof ModuleOpenError || error instanceof CatalogError) throw error
    throw new InstallError(`instalacion de ${module.id} fallida: ${(error as Error).message}`)
  }
}
