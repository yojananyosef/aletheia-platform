import { InstallError } from './errors'
import type { FileSystemPort } from './ports'
import type { InstalledModule } from './types'
import { installPaths } from './installer'

/**
 * Registro de modulos instalados en el sandbox (installed.json por modulo):
 * listado, versiones y enable/disable. Eliminar no toca notas del usuario
 * (se guardan aparte, keyed por (moduleId, book, chapter, verse)).
 */
export class ModuleRegistry {
  constructor(private readonly fs: FileSystemPort, private readonly sandboxDir: string) {}

  async list(): Promise<InstalledModule[]> {
    const paths = installPaths(this.sandboxDir, '')
    if (!(await this.fs.exists(paths.modulesDir))) return []
    const ids = (await this.fs.listDir(paths.modulesDir)).sort()
    const out: InstalledModule[] = []
    for (const id of ids) {
      const record = await this.getRecord(id)
      if (record) out.push(record)
    }
    return out
  }

  async get(id: string): Promise<InstalledModule | undefined> {
    return this.getRecord(id)
  }

  async setEnabled(id: string, enabled: boolean): Promise<InstalledModule> {
    const record = await this.getRecord(id)
    if (!record) throw new InstallError(`modulo ${id} no instalado`)
    const updated: InstalledModule = { ...record, enabled }
    await this.writeRecord(updated)
    return updated
  }

  async remove(id: string): Promise<void> {
    await this.fs.rm(installPaths(this.sandboxDir, id).moduleDir)
  }

  private async getRecord(id: string): Promise<InstalledModule | undefined> {
    const paths = installPaths(this.sandboxDir, id)
    if (!(await this.fs.exists(paths.recordPath))) return undefined
    const bytes = await this.fs.readFile(paths.recordPath)
    return JSON.parse(new TextDecoder().decode(bytes)) as InstalledModule
  }

  private async writeRecord(record: InstalledModule): Promise<void> {
    const paths = installPaths(this.sandboxDir, record.id)
    await this.fs.writeFile(paths.recordPath, new TextEncoder().encode(JSON.stringify(record)))
  }
}
