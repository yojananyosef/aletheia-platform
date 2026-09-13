import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import type {
  CommentaryEntry,
  DictionaryEntry,
  InstalledModule,
} from '@aletheia/module-engine'

import { useEngine } from '@/engine/provider'
import { loadReadingPosition } from '@/engine/reading-store'

interface Passage {
  osis: string
  chapter: number
  verse: number
}

function parsePositive(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  return Number.isInteger(n) && (n as number) >= 1 ? (n as number) : fallback
}

export default function EstudioScreen() {
  const engine = useEngine()
  const params = useLocalSearchParams<{ osis?: string; chapter?: string; verse?: string; dict?: string }>()
  const [passage, setPassage] = useState<Passage>({ osis: 'Gen', chapter: 1, verse: 1 })
  const [commentaries, setCommentaries] = useState<InstalledModule[]>([])
  const [dictionaries, setDictionaries] = useState<InstalledModule[]>([])
  const [selCommId, setSelCommId] = useState<string | null>(null)
  const [selDictId, setSelDictId] = useState<string | null>(null)
  const [entries, setEntries] = useState<CommentaryEntry[] | null>(null)
  const [commError, setCommError] = useState<string | null>(null)
  const [dictQuery, setDictQuery] = useState('')
  const [dictResult, setDictResult] = useState<DictionaryEntry | null>(null)
  const [dictEmpty, setDictEmpty] = useState(false)
  const [dictBusy, setDictBusy] = useState(false)

  // Pasaje: params (desde Leer/Buscar) > posicion de lectura > Gen 1:1.
  useEffect(() => {
    let active = true
    async function resolve() {
      if (typeof params.osis === 'string' && params.osis.length > 0) {
        if (active) {
          setPassage({
            osis: params.osis,
            chapter: parsePositive(params.chapter, 1),
            verse: parsePositive(params.verse, 1),
          })
        }
        return
      }
      const saved = await loadReadingPosition(engine.ports.fs, engine.sandboxDir).catch(() => null)
      if (active && saved) setPassage({ osis: saved.osisCode, chapter: saved.chapter, verse: 1 })
    }
    void resolve()
    return () => {
      active = false
    }
  }, [engine, params.osis, params.chapter, params.verse])

  // Recarga al enfocar la pestana: un modulo instalado desde Biblioteca
  // aparece en tiempo real sin remontar la pantalla. Si el seleccionado se
  // desinstalo fuera, se reelige (JFB/SMITH primero).
  const loadModules = useCallback(async () => {
    const list = await engine.registry.list().catch(() => [])
    const enabled = list.filter((m) => m.enabled)
    const comms = enabled.filter((m) => m.type === 'commentary')
    const dicts = enabled.filter((m) => m.type === 'dictionary' || m.type === 'lexicon')
    setCommentaries(comms)
    setDictionaries(dicts)
    setSelCommId((prev) =>
      prev !== null && comms.some((m) => m.id === prev)
        ? prev
        : (comms.find((m) => m.id === 'JFB')?.id ?? comms[0]?.id ?? null),
    )
    setSelDictId((prev) =>
      prev !== null && dicts.some((m) => m.id === prev)
        ? prev
        : (dicts.find((m) => m.id === 'SMITH')?.id ?? dicts[0]?.id ?? null),
    )
  }, [engine])

  useFocusEffect(
    useCallback(() => {
      void loadModules()
    }, [loadModules]),
  )

  // Comentario sincronizado por pasaje (comentario real, no fixture).
  useEffect(() => {
    if (selCommId === null) {
      setEntries(null)
      return
    }
    let active = true
    setCommError(null)
    void engine
      .openCommentaryReader(selCommId)
      .then(async ({ reader, close }) => {
        try {
          const list = await reader.getChapterEntries(passage.osis, passage.chapter)
          if (active) setEntries(list)
        } finally {
          await close()
        }
      })
      .catch((e) => {
        if (active) {
          setEntries([])
          setCommError((e as Error).message)
        }
      })
    return () => {
      active = false
    }
  }, [engine, selCommId, passage.osis, passage.chapter])

  const runDictLookup = useCallback(
    async (raw: string) => {
      const term = raw.trim()
      if (selDictId === null || term.length === 0) return
      setDictBusy(true)
      setDictEmpty(false)
      setDictResult(null)
      try {
        const { reader, close } = await engine.openDictionaryReader(selDictId)
        try {
          // Long-press → lookup: exacto primero, luego FTS sobre el contenido.
          const exact = await reader.lookup(term)
          if (exact) {
            setDictResult(exact)
          } else {
            const hits = await reader.searchEntries(term, 5).catch(() => [])
            if (hits.length > 0 && hits[0]) setDictResult(hits[0])
            else setDictEmpty(true)
          }
        } finally {
          await close()
        }
      } catch {
        setDictEmpty(true)
      } finally {
        setDictBusy(false)
      }
    },
    [engine, selDictId],
  )

  // Deep-link ?dict=palabra (desde Buscar o futuro long-press del lector).
  const dictParam = typeof params.dict === 'string' ? params.dict : undefined
  useEffect(() => {
    if (dictParam && selDictId !== null) {
      setDictQuery(dictParam)
      void runDictLookup(dictParam)
    }
    // Solo al montar/recibir el param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictParam, selDictId])

  const selComm = useMemo(() => commentaries.find((m) => m.id === selCommId) ?? null, [commentaries, selCommId])
  const selDict = useMemo(() => dictionaries.find((m) => m.id === selDictId) ?? null, [dictionaries, selDictId])
  const target = entries?.find((e) => e.verse === passage.verse) ?? null

  return (
    <ScrollView className="flex-1 bg-reader-bg" contentContainerClassName="gap-4 p-4 pb-10">
      <View className="flex-row items-center justify-between gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capítulo anterior en Estudio"
          onPress={() => setPassage((p) => ({ ...p, chapter: Math.max(1, p.chapter - 1), verse: 1 }))}
          disabled={passage.chapter <= 1}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover px-4 active:opacity-70 disabled:opacity-40"
        >
          <Text className="text-xl text-reader-text">‹</Text>
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-reader-text">
          {`${passage.osis} ${String(passage.chapter)}:${String(passage.verse)}`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capítulo siguiente en Estudio"
          onPress={() => setPassage((p) => ({ ...p, chapter: p.chapter + 1, verse: 1 }))}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover px-4 active:opacity-70"
        >
          <Text className="text-xl text-reader-text">›</Text>
        </Pressable>
      </View>

      <View className="gap-2 rounded-2xl border border-reader-border p-4">
        <Text className="text-xs font-bold uppercase text-reader-muted">Comentario</Text>
        {commentaries.length === 0 ? (
          <Text className="text-sm text-reader-muted">
            Instala un comentario (p. ej. JFB) desde la Biblioteca para verlo sincronizado por pasaje.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {commentaries.map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`Comentario ${m.shortName}`}
                onPress={() => setSelCommId(m.id)}
                className={`min-h-[44px] items-center justify-center rounded-xl px-4 ${m.id === selCommId ? 'bg-accent' : 'bg-hover'}`}
              >
                <Text className={`text-sm font-semibold ${m.id === selCommId ? 'text-accent-fg' : 'text-reader-text'}`}>
                  {m.shortName}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {entries === null ? (
          // Sin comentarios instalados no hay nada que cargar: el aviso de
          // arriba ya lo explica. El spinner solo cuando hay seleccion.
          commentaries.length > 0 ? (
            <View className="items-center gap-2 py-4">
              <ActivityIndicator color="#7a6a4f" />
              <Text className="text-sm text-reader-muted">Cargando comentario…</Text>
            </View>
          ) : null
        ) : entries.length === 0 ? (
          <Text className="text-sm text-reader-muted">
            {commError ?? 'Este comentario no cubre el pasaje.'}
          </Text>
        ) : (
          <View className="gap-3">
            {target !== null ? (
              <View className="gap-1 rounded-xl bg-accent-subtle p-3">
                <Text className="text-xs font-bold uppercase text-reader-muted">
                  {`v.${String(target.verse)}`}
                </Text>
                <Text className="text-sm text-reader-text">{target.text}</Text>
              </View>
            ) : null}
            {entries
              .filter((e) => e.verse !== passage.verse)
              .map((e) => (
                <Pressable
                  key={`${String(e.chapter)}:${String(e.verse)}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver comentario del versículo ${String(e.verse)}`}
                  onPress={() => setPassage((p) => ({ ...p, verse: e.verse }))}
                  className="min-h-[44px] gap-1 rounded-xl bg-hover p-3 active:opacity-70"
                >
                  <Text className="text-xs font-bold text-reader-muted">{`v.${String(e.verse)}`}</Text>
                  <Text className="text-sm text-reader-text" numberOfLines={3}>
                    {e.text}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}
        {selComm !== null ? (
          <Text className="text-xs text-reader-muted">{selComm.attribution}</Text>
        ) : null}
      </View>

      <View className="gap-2 rounded-2xl border border-reader-border p-4">
        <Text className="text-xs font-bold uppercase text-reader-muted">Diccionario</Text>
        {dictionaries.length === 0 ? (
          <Text className="text-sm text-reader-muted">
            Instala un diccionario (p. ej. Smith) desde la Biblioteca para consultas.
          </Text>
        ) : (
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              {dictionaries.map((m) => (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Diccionario ${m.shortName}`}
                  onPress={() => setSelDictId(m.id)}
                  className={`min-h-[44px] items-center justify-center rounded-xl px-4 ${m.id === selDictId ? 'bg-accent' : 'bg-hover'}`}
                >
                  <Text className={`text-sm font-semibold ${m.id === selDictId ? 'text-accent-fg' : 'text-reader-text'}`}>
                    {m.shortName}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TextInput
                accessibilityLabel="Palabra a buscar en el diccionario"
                value={dictQuery}
                onChangeText={setDictQuery}
                onSubmitEditing={() => runDictLookup(dictQuery)}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="p. ej. Aaron, gracia…"
                placeholderTextColor="#918977"
                className="min-h-[44px] flex-1 rounded-xl bg-hover px-4 text-base text-reader-text"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Buscar en el diccionario"
                onPress={() => runDictLookup(dictQuery)}
                disabled={dictBusy}
                className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 active:opacity-70 disabled:opacity-40"
              >
                <Text className="text-sm font-semibold text-accent-fg">Ver</Text>
              </Pressable>
            </View>
            {dictBusy ? (
              <ActivityIndicator color="#7a6a4f" />
            ) : dictResult !== null ? (
              <View className="gap-1 rounded-xl bg-hover p-3">
                <Text className="text-base font-bold text-reader-text">{dictResult.key}</Text>
                <Text className="text-sm text-reader-text">{dictResult.content}</Text>
              </View>
            ) : dictEmpty ? (
              <Text className="text-sm text-reader-muted">Sin resultados en este diccionario.</Text>
            ) : null}
          </View>
        )}
        {selDict !== null ? (
          <Text className="text-xs text-reader-muted">{selDict.attribution}</Text>
        ) : null}
      </View>
    </ScrollView>
  )
}
