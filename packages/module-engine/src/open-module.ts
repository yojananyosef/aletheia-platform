import { ModuleOpenError } from './errors'
import type { EnginePorts, SqliteDb } from './ports'
import type { InstalledModule } from './types'
import { installPaths, validateAmodDb } from './installer'

export interface OpenedModule {
  module: InstalledModule
  db: SqliteDb
}

/**
 * Abre un modulo instalado: valida el registro (installed.json) y el content.db en
 * modo inmutable (application_id 0x414D4F44 + schemaVersion). Si la validacion falla
 * el modulo se reporta como danado (la UI ofrece reinstalar).
 */
export async function openInstalledModule(ports: EnginePorts, sandboxDir: string, moduleId: string): Promise<OpenedModule> {
  const paths = installPaths(sandboxDir, moduleId)
  if (!(await ports.fs.exists(paths.recordPath)) || !(await ports.fs.exists(paths.dbPath))) {
    throw new ModuleOpenError(`modulo ${moduleId} no instalado`)
  }
  const module = JSON.parse(new TextDecoder().decode(await ports.fs.readFile(paths.recordPath))) as InstalledModule
  const db = await ports.sqlite.openReadOnly(paths.dbPath)
  try {
    await validateAmodDb(db, module.schemaVersion)
  } catch (error) {
    await db.close().catch(() => {})
    throw error
  }
  return { module, db }
}
