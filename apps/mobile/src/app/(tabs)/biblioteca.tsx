import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native'

import type { Catalog, CatalogModule, InstalledModule } from '@aletheia/module-engine'

import { ModuleCard } from '@/components/module-card'
import { verifyFts5Support } from '@/engine/fts'
import { useEngine } from '@/engine/provider'

export default function BibliotecaScreen() {
  const engine = useEngine()
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [installed, setInstalled] = useState<Map<string, InstalledModule>>(new Map())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fts, setFts] = useState<boolean | null>(null)

  const loadInstalled = useCallback(async () => {
    try {
      const list = await engine.registry.list()
      setInstalled(new Map(list.map((m) => [m.id, m])))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [engine])

  const loadCatalog = useCallback(
    async (refresh = false) => {
      setError(null)
      try {
        const c = await engine.getCatalog(refresh)
        setCatalog(c)
      } catch (e) {
        setError(`No se pudo obtener el catálogo oficial: ${(e as Error).message}`)
      }
    },
    [engine],
  )

  useEffect(() => {
    void loadCatalog()
    void loadInstalled()
    void verifyFts5Support()
      .then(setFts)
      .catch(() => setFts(false))
  }, [loadCatalog, loadInstalled])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadCatalog(true)
    setRefreshing(false)
  }, [loadCatalog])

  const handleInstall = useCallback(
    async (module: CatalogModule) => {
      setBusyId(module.id)
      setError(null)
      try {
        await engine.install(module)
        await loadInstalled()
      } catch (e) {
        setError(`Instalación fallida: ${(e as Error).message}`)
      } finally {
        setBusyId(null)
      }
    },
    [engine, loadInstalled],
  )

  const handleRemove = useCallback(
    async (id: string) => {
      setBusyId(id)
      setError(null)
      try {
        await engine.remove(id)
        await loadInstalled()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusyId(null)
      }
    },
    [engine, loadInstalled],
  )

  const renderItem = useCallback(
    ({ item }: { item: CatalogModule }) => (
      <ModuleCard
        module={item}
        installed={installed.get(item.id)}
        busy={busyId === item.id}
        onInstall={handleInstall}
        onRemove={handleRemove}
      />
    ),
    [installed, busyId, handleInstall, handleRemove],
  )

  return (
    <FlatList
      className="flex-1 bg-reader-bg"
      contentContainerClassName="p-4 gap-4"
      data={catalog?.modules ?? []}
      keyExtractor={(m) => m.id}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7a6a4f" />
      }
      ListHeaderComponent={
        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-sm text-reader-muted">
              {catalog
                ? `Catálogo oficial v${String(catalog.version)} · ${String(catalog.modules.length)} módulos`
                : 'Cargando catálogo oficial…'}
            </Text>
            {fts !== null ? (
              <View
                className={`rounded-full px-2.5 py-1 ${fts ? 'bg-accent-subtle' : 'border border-reader-border'}`}
              >
                <Text className="text-xs font-semibold text-reader-text">
                  FTS5 {fts === null ? 'verificando…' : fts ? 'verificado ✓' : 'no soportado'}
                </Text>
              </View>
            ) : null}
          </View>
          {error !== null ? (
            <View className="rounded-xl border border-reader-border bg-hover p-3">
              <Text className="text-sm text-reader-text">{error}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        catalog === null ? (
          <View className="items-center gap-3 py-10">
            <ActivityIndicator color="#7a6a4f" />
            <Text className="text-sm text-reader-muted">Descargando catalog.json…</Text>
          </View>
        ) : (
          <View className="py-10">
            <Text className="text-center text-sm text-reader-muted">
              El catálogo no tiene módulos todavía.
            </Text>
          </View>
        )
      }
    />
  )
}
