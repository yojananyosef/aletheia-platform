import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { searchInstalledModules, type GlobalSearchResults } from '@aletheia/module-engine'

import { useEngine } from '@/engine/provider'
import { saveReadingPosition } from '@/engine/reading-store'

function excerpt(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

export default function BuscarScreen() {
  const engine = useEngine()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<GlobalSearchResults | null>(null)

  const run = useCallback(
    async (raw: string) => {
      const q = raw.trim()
      if (q.length === 0) return
      setBusy(true)
      try {
        const installed = await engine.registry.list()
        const res = await searchInstalledModules(engine.ports, engine.sandboxDir, installed, q, {
          limitPerModule: 15,
        })
        setResults(res)
      } catch (e) {
        setResults({ query: q, bibles: [], commentaries: [], dictionaries: [], errors: [{ moduleId: '?', moduleName: 'búsqueda', message: (e as Error)?.message ?? String(e) }] })
      } finally {
        setBusy(false)
      }
    },
    [engine],
  )

  useEffect(() => {
    setResults(null)
  }, [engine])

  return (
    <ScrollView className="flex-1 bg-reader-bg" contentContainerClassName="gap-4 p-4 pb-10">
      <View className="flex-row gap-2">
        <TextInput
          accessibilityLabel="Buscar en los módulos instalados"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => run(query)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Buscar: jesus, gracia, pacto…"
          placeholderTextColor="#918977"
          className="min-h-[44px] flex-1 rounded-xl bg-hover px-4 text-base text-reader-text"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          onPress={() => run(query)}
          disabled={busy}
          className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 active:opacity-70 disabled:opacity-40"
        >
          <Text className="text-sm font-semibold text-accent-fg">Buscar</Text>
        </Pressable>
      </View>
      <Text className="text-xs text-reader-muted">
        FTS5 sin acentos: «jesus» encuentra «Jesús». La búsqueda cubre Biblias, comentarios y
        diccionarios instalados.
      </Text>

      {busy ? (
        <View className="items-center gap-2 py-6">
          <ActivityIndicator color="#7a6a4f" />
          <Text className="text-sm text-reader-muted">Buscando…</Text>
        </View>
      ) : results === null ? null : (
        <View className="gap-4">
          {results.errors.length > 0 ? (
            <View className="gap-2 rounded-2xl border border-reader-border p-4">
              <Text className="text-xs font-bold uppercase text-reader-muted">
                Aviso ({String(results.errors.length)})
              </Text>
              {results.errors.map((e) => (
                <Text key={e.moduleId} className="text-sm text-reader-muted">
                  {`${e.moduleName}: ${e.message}`}
                </Text>
              ))}
            </View>
          ) : null}
          <ResultGroup
            title={`Biblias (${String(results.bibles.length)})`}
            empty="Sin coincidencias en Biblias instaladas."
            items={results.bibles.map((h) => ({
              key: `${h.moduleId}:${h.osisCode}:${String(h.chapter)}:${String(h.verse)}`,
              heading: `${h.bookName} ${String(h.chapter)}:${String(h.verse)} · ${h.moduleName}`,
              body: excerpt(h.text),
              onOpen: () => {
                void saveReadingPosition(engine.ports.fs, engine.sandboxDir, {
                  moduleId: h.moduleId,
                  osisCode: h.osisCode,
                  chapter: h.chapter,
                }).catch(() => {})
                router.push({ pathname: '/leer', params: { verse: String(h.verse) } })
              },
            }))}
          />
          <ResultGroup
            title={`Comentarios (${String(results.commentaries.length)})`}
            empty="Sin coincidencias en comentarios instalados."
            items={results.commentaries.map((h) => ({
              key: `${h.moduleId}:${h.osisCode}:${String(h.chapter)}:${String(h.verse)}`,
              heading: `${h.bookName} ${String(h.chapter)}:${String(h.verse)} · ${h.moduleName}`,
              body: excerpt(h.text, 200),
              onOpen: () => {
                router.push({
                  pathname: '/estudio',
                  params: { osis: h.osisCode, chapter: String(h.chapter), verse: String(h.verse) },
                })
              },
            }))}
          />
          <ResultGroup
            title={`Diccionarios (${String(results.dictionaries.length)})`}
            empty="Sin coincidencias en diccionarios instalados."
            items={results.dictionaries.map((h) => ({
              key: `${h.moduleId}:${h.key}`,
              heading: `${h.key} · ${h.moduleName}`,
              body: excerpt(h.content, 200),
              onOpen: () => {
                router.push({ pathname: '/estudio', params: { dict: h.key } })
              },
            }))}
          />
        </View>
      )}
    </ScrollView>
  )
}

interface ResultItem {
  key: string
  heading: string
  body: string
  onOpen(): void
}

function ResultGroup({ title, empty, items }: { title: string; empty: string; items: ResultItem[] }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase text-reader-muted">{title}</Text>
      {items.length === 0 ? (
        <Text className="text-sm text-reader-muted">{empty}</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${item.heading}`}
            onPress={item.onOpen}
            className="min-h-[44px] gap-1 rounded-xl bg-hover p-3 active:opacity-70"
          >
            <Text className="text-sm font-bold text-reader-text">{item.heading}</Text>
            <Text className="text-sm text-reader-muted" numberOfLines={3}>
              {item.body}
            </Text>
          </Pressable>
        ))
      )}
    </View>
  )
}
