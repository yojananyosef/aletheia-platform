import { Paths } from 'expo-file-system'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  BibleReader,
  CatalogService,
  installModule,
  ModuleRegistry,
  openInstalledModule,
  type Catalog,
  type CatalogModule,
  type EnginePorts,
  type InstalledModule,
} from '@aletheia/module-engine'

import { createEnginePorts } from './adapters'

interface EngineContextValue {
  ports: EnginePorts
  sandboxDir: string
  settingsPath: string
  catalogPath: string
  registry: ModuleRegistry
  getCatalog(refresh?: boolean): Promise<Catalog>
  install(module: CatalogModule): Promise<InstalledModule>
  remove(id: string): Promise<void>
  openBibleReader(moduleId: string): Promise<{ reader: BibleReader; close(): Promise<void> }>
}

const EngineContext = createContext<EngineContextValue | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const value = useMemo<EngineContextValue>(() => {
    const ports = createEnginePorts()
    const sandboxDir = Paths.document.uri
    const registry = new ModuleRegistry(ports.fs, sandboxDir)
    const catalog = new CatalogService(ports.http, ports.fs, `${sandboxDir}/catalog.json`)
    return {
      ports,
      sandboxDir,
      settingsPath: `${sandboxDir}/settings.json`,
      catalogPath: `${sandboxDir}/catalog.json`,
      registry,
      getCatalog: (refresh = false) => (refresh ? catalog.refresh() : catalog.get()),
      install: (module) => installModule(module, ports, sandboxDir),
      remove: (id) => registry.remove(id),
      openBibleReader: async (moduleId: string) => {
        const opened = await openInstalledModule(ports, sandboxDir, moduleId)
        const reader = new BibleReader(opened.db, {
          hasHeadings: opened.module.features.hasHeadings,
          hasFootnotes: opened.module.features.hasFootnotes,
        })
        return {
          reader,
          close: () => opened.db.close().catch(() => {}),
        }
      },
    }
  }, [])

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>
}

export function useEngine(): EngineContextValue {
  const ctx = useContext(EngineContext)
  if (!ctx) throw new Error('useEngine debe usarse dentro de EngineProvider')
  return ctx
}
