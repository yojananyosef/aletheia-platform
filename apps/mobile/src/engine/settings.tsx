import { Uniwind } from 'uniwind'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  DEFAULT_READER_SETTINGS,
  parseReaderSettings,
  resolveReaderSettings,
  type ReaderSettings,
} from '@aletheia/core'

import { useEngine } from './provider'

interface SettingsContextValue {
  settings: ReaderSettings
  update(patch: Partial<ReaderSettings>): void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const engine = useEngine()
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const bytes = await engine.ports.fs.readFile(engine.settingsPath)
        const parsed = parseReaderSettings(new TextDecoder().decode(bytes))
        if (active) {
          setSettings(parsed)
          Uniwind.setTheme(parsed.theme)
        }
      } catch {
        Uniwind.setTheme(DEFAULT_READER_SETTINGS.theme)
      }
      if (active) setHydrated(true)
    }
    void load()
    return () => {
      active = false
    }
  }, [engine])

  useEffect(() => {
    if (!hydrated) return
    Uniwind.setTheme(settings.theme)
  }, [settings.theme, hydrated])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (patch) => {
        setSettings((prev) => {
          const next = resolveReaderSettings({ ...prev, ...patch })
          void engine.ports.fs
            .writeFile(engine.settingsPath, new TextEncoder().encode(JSON.stringify(next)))
            .catch(() => {})
          return next
        })
      },
    }),
    [settings, engine],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider')
  return ctx
}
