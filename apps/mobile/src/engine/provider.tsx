import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  BibleReader,
  CatalogService,
  CommentaryReader,
  DevotionReader,
  DictionaryReader,
  installModule,
  ModuleRegistry,
  openInstalledModule,
  type Catalog,
  type CatalogModule,
  type EnginePorts,
  type InstalledModule,
} from '@aletheia/module-engine'

import { createEnginePorts, getSandboxDir } from './adapters'

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
  openCommentaryReader(moduleId: string): Promise<{ reader: CommentaryReader; close(): Promise<void> }>
  openDictionaryReader(moduleId: string): Promise<{ reader: DictionaryReader; close(): Promise<void> }>
  openDevotionReader(moduleId: string): Promise<{ reader: DevotionReader; close(): Promise<void> }>
}

const EngineContext = createContext<EngineContextValue | null>(null)

export function EngineProvider({ children }: { children: ReactNode }) {
  const value = useMemo<EngineContextValue>(() => {
    const ports = createEnginePorts()
    // Nativo: Paths.document.uri; web: raiz logica OPFS 'aletheia' (Metro
    // resuelve './adapters' por plataforma; expo-file-system no existe en web).
    const sandboxDir = getSandboxDir()
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
      openCommentaryReader: async (moduleId: string) => {
        const opened = await openInstalledModule(ports, sandboxDir, moduleId)
        return { reader: new CommentaryReader(opened.db), close: () => opened.db.close().catch(() => {}) }
      },
      openDictionaryReader: async (moduleId: string) => {
        const opened = await openInstalledModule(ports, sandboxDir, moduleId)
        return { reader: new DictionaryReader(opened.db), close: () => opened.db.close().catch(() => {}) }
      },
      openDevotionReader: async (moduleId: string) => {
        const opened = await openInstalledModule(ports, sandboxDir, moduleId)
        return { reader: new DevotionReader(opened.db), close: () => opened.db.close().catch(() => {}) }
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
