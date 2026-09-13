import { Link, router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'

import { verseOfDayRef, verseRefLabel } from '@aletheia/core'
import type { DevotionEntry, InstalledModule } from '@aletheia/module-engine'

import { useEngine } from '@/engine/provider'
import { loadBookmarks, loadReadingPosition, type ReadingPosition } from '@/engine/reading-store'

interface VerseOfDay {
  label: string
  text?: string | undefined
}

export default function InicioScreen() {
  const engine = useEngine()
  const [installed, setInstalled] = useState<InstalledModule[] | null>(null)
  const [position, setPosition] = useState<ReadingPosition | null>(null)
  const [positionLabel, setPositionLabel] = useState<string | null>(null)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [devotion, setDevotion] = useState<DevotionEntry | null>(null)
  const [devotionModule, setDevotionModule] = useState<string | null>(null)
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null)

  const refresh = useCallback(async () => {
    const list = await engine.registry.list().catch(() => [])
    setInstalled(list)
    const enabled = list.filter((m) => m.enabled)
    const saved = await loadReadingPosition(engine.ports.fs, engine.sandboxDir).catch(() => null)
    setPosition(saved)
    setBookmarkCount((await loadBookmarks(engine.ports.fs, engine.sandboxDir).catch(() => [])).length)

    // Continuar leyendo: etiqueta con nombre de libro del modulo en uso.
    if (saved) {
      const bible = enabled.find((m) => m.id === saved.moduleId && m.type === 'bible')
      if (bible) {
        try {
          const { reader, close } = await engine.openBibleReader(bible.id)
          try {
            const book = await reader.getBook(saved.osisCode)
            setPositionLabel(`${bible.shortName} · ${book.name} ${String(saved.chapter)}`)
          } finally {
            await close()
          }
        } catch {
          setPositionLabel(`${saved.moduleId} · ${saved.osisCode} ${String(saved.chapter)}`)
        }
      } else {
        setPositionLabel(`${saved.moduleId} · ${saved.osisCode} ${String(saved.chapter)}`)
      }
    } else {
      setPositionLabel(null)
    }

    // Devocional del dia (SME si esta instalado).
    const dev = enabled.find((m) => m.type === 'devotion')
    if (dev) {
      try {
        const { reader, close } = await engine.openDevotionReader(dev.id)
        try {
          const now = new Date()
          const entry = await reader.getDay(now.getMonth() + 1, now.getDate())
          setDevotion(entry ?? null)
          setDevotionModule(dev.shortName)
        } finally {
          await close()
        }
      } catch {
        setDevotion(null)
      }
    } else {
      setDevotion(null)
    }

    // Versiculo del dia: rotacion PD, texto desde la primera Biblia instalada.
    const ref = verseOfDayRef(new Date())
    const firstBible = enabled.find((m) => m.type === 'bible')
    if (firstBible) {
      try {
        const { reader, close } = await engine.openBibleReader(firstBible.id)
        try {
          const chapter = await reader.getChapter(ref.osisCode, ref.chapter)
          const verse = chapter.verses.find((v) => v.verse === ref.verse)
          setVerseOfDay({
            label: verseRefLabel(ref, chapter.book.name),
            text: verse?.text,
          })
        } finally {
          await close()
        }
      } catch {
        setVerseOfDay({ label: verseRefLabel(ref) })
      }
    } else {
      setVerseOfDay({ label: verseRefLabel(ref) })
    }
  }, [engine])

  // Recarga al enfocar: lo instalado desde Biblioteca se refleja al volver.
  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh]),
  )

  return (
    <ScrollView className="flex-1 bg-reader-bg" contentContainerClassName="gap-4 p-5 pb-10">
      <View className="gap-2 rounded-2xl border border-reader-border bg-hover p-5">
        <Text className="text-2xl font-bold text-reader-text">Aletheia</Text>
        <Text className="text-base text-reader-muted">
          Plataforma bíblica gratuita y abierta: módulos del catálogo oficial, siempre con su
          licencia visible.
        </Text>
      </View>

      <View className="gap-3 rounded-2xl border border-reader-border p-5">
        <Text className="text-xs font-bold uppercase text-reader-muted">Continuar leyendo</Text>
        {installed === null ? (
          <ActivityIndicator color="#7a6a4f" />
        ) : position !== null && positionLabel !== null ? (
          <View className="gap-3">
            <Text className="text-lg text-reader-text">{positionLabel}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Continuar leyendo ${positionLabel}`}
              onPress={() => router.push('/leer')}
              className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 active:opacity-70"
            >
              <Text className="text-base font-semibold text-accent-fg">Continuar</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-base text-reader-text">
              {installed.length === 0
                ? 'Aún no tienes módulos instalados.'
                : 'Abre la Biblioteca o el Lector para empezar.'}
            </Text>
            <Link href="/biblioteca" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ir a la Biblioteca"
                className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 active:bg-hover"
              >
                <Text className="text-base font-semibold text-accent-fg">Ir a la Biblioteca</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </View>

      <View className="gap-2 rounded-2xl border border-reader-border p-5">
        <Text className="text-xs font-bold uppercase text-reader-muted">
          {devotion !== null && devotionModule !== null
            ? `Devocional de hoy · ${devotionModule}`
            : 'Devocional de hoy'}
        </Text>
        {devotion !== null ? (
          <View className="gap-2">
            <Text className="text-lg font-bold text-reader-text">
              {devotion.scripture ?? devotion.title}
            </Text>
            <Text className="text-sm text-reader-text">{devotion.content}</Text>
          </View>
        ) : (
          <Text className="text-sm text-reader-muted">
            Instala el devocional SME desde la Biblioteca para ver la lectura de hoy.
          </Text>
        )}
      </View>

      <View className="gap-2 rounded-2xl border border-reader-border p-5">
        <Text className="text-xs font-bold uppercase text-reader-muted">Versículo del día</Text>
        {verseOfDay !== null ? (
          <View className="gap-2">
            {verseOfDay.text !== undefined ? (
              <Text className="text-base text-reader-text">«{verseOfDay.text}»</Text>
            ) : null}
            <Text className="text-sm font-semibold text-reader-muted">{verseOfDay.label}</Text>
          </View>
        ) : (
          <ActivityIndicator color="#7a6a4f" />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir ayuda local"
        onPress={() => router.push('/ayuda')}
        className="min-h-[44px] items-center justify-center rounded-xl border border-reader-border px-5 active:bg-hover"
      >
        <Text className="text-base font-semibold text-reader-text">Ayuda</Text>
      </Pressable>

      <View className="gap-2 rounded-2xl border border-reader-border p-5">
        <Text className="text-xs font-bold uppercase text-reader-muted">Tu progreso</Text>
        <Text className="text-sm text-reader-text">
          {installed === null
            ? 'Revisando tu biblioteca…'
            : `${String(installed.length)} módulo${installed.length === 1 ? '' : 's'} · ${String(bookmarkCount)} marcador${bookmarkCount === 1 ? '' : 'es'}`}
        </Text>
      </View>
    </ScrollView>
  )
}
