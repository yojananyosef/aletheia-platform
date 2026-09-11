import { openInstalledModule } from '../open-module'
import type { EnginePorts } from '../ports'
import type { InstalledModule } from '../types'
import { BibleReader, type VerseSearchResult } from './bible'
import { CommentaryReader, type CommentaryEntry } from './commentary'
import { DictionaryReader, type DictionaryEntry } from './dictionary'

export interface BibleHit extends VerseSearchResult {
  moduleId: string
  moduleName: string
}

export interface CommentaryHit extends CommentaryEntry {
  moduleId: string
  moduleName: string
}

export interface DictionaryHit extends DictionaryEntry {
  moduleId: string
  moduleName: string
}

export interface SearchModuleError {
  moduleId: string
  moduleName: string
  message: string
}

export interface GlobalSearchResults {
  query: string
  bibles: BibleHit[]
  commentaries: CommentaryHit[]
  dictionaries: DictionaryHit[]
  /** Modulos que fallaron (danado o MATCH invalida): la UI los muestra en vez de un 0 mudo. */
  errors: SearchModuleError[]
}

export interface GlobalSearchOptions {
  limitPerModule?: number | undefined
}

/**
 * Buscar F4: FTS5 global sobre los modulos instalados y habilitados
 * (biblias + comentarios + diccionarios/lexicos), resultados agrupados.
 * Un modulo con sintaxis MATCH invalida o danado se salta sin romper la
 * busqueda global (best-effort por modulo).
 */
export async function searchInstalledModules(
  ports: EnginePorts,
  sandboxDir: string,
  installed: InstalledModule[],
  query: string,
  options: GlobalSearchOptions = {},
): Promise<GlobalSearchResults> {
  const trimmed = query.trim()
  const out: GlobalSearchResults = { query: trimmed, bibles: [], commentaries: [], dictionaries: [], errors: [] }
  if (!trimmed) return out
  const limit = options.limitPerModule ?? 20
  for (const mod of installed) {
    if (!mod.enabled) continue
    try {
      const opened = await openInstalledModule(ports, sandboxDir, mod.id)
      try {
        if (mod.type === 'bible') {
          const reader = new BibleReader(opened.db, {
            hasHeadings: mod.features.hasHeadings,
            hasFootnotes: mod.features.hasFootnotes,
          })
          const hits = await reader.searchVerses(trimmed, limit)
          for (const h of hits) out.bibles.push({ ...h, moduleId: mod.id, moduleName: mod.name })
        } else if (mod.type === 'commentary') {
          const reader = new CommentaryReader(opened.db)
          const hits = await reader.searchEntries(trimmed, limit)
          for (const h of hits) out.commentaries.push({ ...h, moduleId: mod.id, moduleName: mod.name })
        } else if (mod.type === 'dictionary' || mod.type === 'lexicon') {
          const reader = new DictionaryReader(opened.db)
          // El FTS solo indexa `content`: anteponer coincidencias de
          // encabezado (la query suele ser la palabra buscada: "grace"->GRACE).
          const seen = new Set<string>()
          const keyed = await reader.lookupPrefix(trimmed, limit)
          for (const h of keyed) {
            seen.add(h.key)
            out.dictionaries.push({ ...h, moduleId: mod.id, moduleName: mod.name })
          }
          const hits = await reader.searchEntries(trimmed, limit)
          for (const h of hits) {
            if (seen.has(h.key)) continue
            out.dictionaries.push({ ...h, moduleId: mod.id, moduleName: mod.name })
          }
        }
      } finally {
        await opened.db.close().catch(() => {})
      }
    } catch (e) {
      // Modulo danado o MATCH invalido: se salta sin romper la busqueda
      // global, pero se reporta para que la UI no muestre un 0 mudo.
      out.errors.push({ moduleId: mod.id, moduleName: mod.name, message: (e as Error)?.message ?? String(e) })
    }
  }
  return out
}
