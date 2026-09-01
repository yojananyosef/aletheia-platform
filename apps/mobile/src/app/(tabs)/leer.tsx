import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'

import { THEME_TOKENS } from '@aletheia/core'
import type { BibleBook, BibleReader, ChapterContent, Heading } from '@aletheia/module-engine'

import { useEngine } from '@/engine/provider'
import { useSettings } from '@/engine/settings'
import { FONT_FAMILY_NAMES } from '@/theme/typography'

type ChapterItem = { kind: 'heading'; heading: Heading } | { kind: 'verse'; verseIndex: number }

interface OpenedBible {
  reader: BibleReader
  close(): Promise<void>
}

function buildChapterItems(content: ChapterContent): ChapterItem[] {
  const items: ChapterItem[] = []
  const headingsByVerse = new Map<number, Heading[]>()
  for (const h of content.headings) {
    const list = headingsByVerse.get(h.beforeVerse) ?? []
    list.push(h)
    headingsByVerse.set(h.beforeVerse, list)
  }
  for (const [i, verse] of content.verses.entries()) {
    for (const h of headingsByVerse.get(verse.verse) ?? []) {
      items.push({ kind: 'heading', heading: h })
    }
    items.push({ kind: 'verse', verseIndex: i })
  }
  return items
}

export default function LeerScreen() {
  const engine = useEngine()
  const { settings } = useSettings()
  const [moduleName, setModuleName] = useState<string | null>(null)
  const [books, setBooks] = useState<BibleBook[]>([])
  const [book, setBook] = useState<BibleBook | null>(null)
  const [chapter, setChapter] = useState(1)
  const [content, setContent] = useState<ChapterContent | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleRef = useRef<OpenedBible | null>(null)
  const moduleIdRef = useRef<string | null>(null)

  const openFirstBible = useCallback(async () => {
    const installed = (await engine.registry.list()).filter(
      (m) => m.type === 'bible' && m.enabled,
    )
    const first = installed[0]
    if (!first) {
      handleRef.current = null
      moduleIdRef.current = null
      setModuleName(null)
      setBooks([])
      setBook(null)
      setContent(null)
      setError(null)
      return
    }
    if (moduleIdRef.current === first.id && handleRef.current !== null) return
    await handleRef.current?.close().catch(() => {})
    const opened = await engine.openBibleReader(first.id)
    handleRef.current = opened
    moduleIdRef.current = first.id
    const list = await opened.reader.listBooks()
    setModuleName(first.name)
    setBooks(list)
    setBook((prev) => list.find((b) => b.osisCode === prev?.osisCode) ?? list[0] ?? null)
  }, [engine])

  useEffect(() => {
    let active = true
    void openFirstBible()
      .catch((e) => {
        if (active) setError((e as Error).message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [openFirstBible])

  useEffect(() => {
    return () => {
      void handleRef.current?.close()
      handleRef.current = null
    }
  }, [])

  useEffect(() => {
    const opened = handleRef.current
    if (!opened || book === null) return
    let active = true
    setLoading(true)
    setError(null)
    void opened.reader
      .getChapter(book.osisCode, chapter)
      .then((c) => {
        if (active) setContent(c)
      })
      .catch((e) => {
        if (active) {
          setError((e as Error).message)
          setContent(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [book, chapter, moduleName])

  const fontFamily = FONT_FAMILY_NAMES[settings.fontFamily]
  const items = content !== null ? buildChapterItems(content) : []
  const verseNumbersColor = THEME_TOKENS[settings.theme].readerMuted

  const changeChapter = (delta: number) => {
    if (content === null) return
    const next = chapter + delta
    if (next >= 1 && next <= content.book.chapterCount) setChapter(next)
  }

  if (moduleName === null) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-reader-bg p-6">
        <Text className="text-center text-base text-reader-text">
          No hay Biblias instaladas todavía.
        </Text>
        <Text className="text-center text-sm text-reader-muted">
          Abre la Biblioteca e instala un módulo del catálogo oficial (p. ej. ASV).
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-reader-bg">
      <View className="gap-2 border-b border-reader-border px-4 pb-2 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir libro"
          onPress={() => setPickerOpen(true)}
          className="min-h-[44px] flex-row items-center justify-center rounded-xl bg-hover px-4"
        >
          <Text className="text-base font-semibold text-reader-text">
            {book !== null ? `${book.name} ${String(chapter)}` : 'Elegir libro'}
          </Text>
        </Pressable>
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capítulo anterior"
            disabled={chapter <= 1}
            onPress={() => changeChapter(-1)}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-4 active:bg-hover disabled:opacity-40"
          >
            <Text className="text-xl text-reader-text">‹</Text>
          </Pressable>
          <Text className="text-sm text-reader-muted">
            {book !== null
              ? `${book.name} ${String(chapter)} / ${String(book.chapterCount)}`
              : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capítulo siguiente"
            disabled={content !== null && chapter >= content.book.chapterCount}
            onPress={() => changeChapter(1)}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-4 active:bg-hover disabled:opacity-40"
          >
            <Text className="text-xl text-reader-text">›</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3 bg-reader-bg">
          <ActivityIndicator color={verseNumbersColor} />
          <Text className="text-sm text-reader-muted">Cargando capítulo…</Text>
        </View>
      ) : error !== null ? (
        <View className="flex-1 items-center justify-center gap-2 bg-reader-bg p-6">
          <Text className="text-center text-sm text-reader-text">{error}</Text>
        </View>
      ) : content === null ? (
        <View className="flex-1 items-center justify-center bg-reader-bg">
          <Text className="text-sm text-reader-muted">Capítulo vacío.</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="px-5 pb-10 pt-3">
          <Text
            style={{
              fontFamily,
              fontSize: settings.fontSize,
              lineHeight: settings.fontSize * settings.lineHeight,
              letterSpacing: settings.letterSpacing,
            }}
            className="text-reader-text"
          >
            {items.map((item, i) =>
              item.kind === 'heading' ? (
                <Text key={`h-${String(i)}`}>
                  {'\n\n'}
                  <Text style={{ fontWeight: '700', color: verseNumbersColor }}>{item.heading.title}</Text>
                  {'\n'}
                </Text>
              ) : (
                <Text key={`v-${String(i)}`}>
                  {settings.verseNumbers ? (
                    <Text style={{ fontSize: settings.fontSize * 0.65, color: verseNumbersColor }}>
                      {' '}
                      {String(content.verses[item.verseIndex]?.verse ?? '')}{' '}
                    </Text>
                  ) : null}
                  {(content.verses[item.verseIndex]?.text ?? '') + ' '}
                </Text>
              ),
            )}
          </Text>
        </ScrollView>
      )}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-2xl border-t border-reader-border bg-reader-bg pt-4">
            <View className="flex-row items-center justify-between px-5 pb-2">
              <Text className="text-lg font-bold text-reader-text">{moduleName}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar selector de libros"
                onPress={() => setPickerOpen(false)}
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:bg-hover"
              >
                <Text className="text-xl text-reader-text">✕</Text>
              </Pressable>
            </View>
            <FlatList
              data={books}
              keyExtractor={(b) => String(b.bookId)}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.name}`}
                  onPress={() => {
                    setBook(item)
                    setChapter(1)
                    setPickerOpen(false)
                  }}
                  className={`min-h-[44px] flex-row items-center justify-between px-5 py-2 active:bg-hover ${book?.osisCode === item.osisCode ? 'bg-hover' : ''}`}
                >
                  <Text className="text-base text-reader-text">{item.name}</Text>
                  <Text className="text-xs text-reader-muted">{String(item.chapterCount)} cap.</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}
