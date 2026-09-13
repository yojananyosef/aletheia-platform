import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'

import {
  THEME_TOKENS,
  TTSOrchestrator,
  findWordIndexAtOffset,
  splitWords,
  toBionicSegments,
  toSyllabicText,
  type ColumnMode,
  type FontFamilyId,
  type ThemeName,
  type TTSState,
} from '@aletheia/core'
import type {
  BibleBook,
  BibleReader,
  ChapterContent,
  Footnote,
  Heading,
  VerseText,
} from '@aletheia/module-engine'

import { useEngine } from '@/engine/provider'
import {
  bookmarkKey,
  loadBookmarks,
  loadReadingPosition,
  saveBookmarks,
  saveReadingPosition,
  type Bookmark,
} from '@/engine/reading-store'
import { useSettings } from '@/engine/settings'
import { speechEngine } from '@/engine/expo-speech-backend'
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

function verseLabel(verse: VerseText): string {
  return verse.verseEnd !== undefined ? `${String(verse.verse)}–${String(verse.verseEnd)}` : String(verse.verse)
}

function verseRef(bookName: string, chapter: number, verse: VerseText): string {
  return `${bookName} ${String(chapter)}:${verseLabel(verse)}`
}

const THEME_OPTIONS: Array<{ id: ThemeName; label: string }> = [
  { id: 'pergamino', label: 'Pergamino' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'noche', label: 'Noche' },
]

const FONT_OPTIONS: Array<{ id: FontFamilyId; label: string }> = [
  { id: 'system', label: 'Sistema' },
  { id: 'literata', label: 'Literata' },
  { id: 'atkinson', label: 'Atkinson' },
  { id: 'opendyslexic', label: 'OpenDyslexic' },
]

const COLUMN_OPTIONS: Array<{ id: ColumnMode; label: string }> = [
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: 'auto', label: 'Auto' },
]

export default function LeerScreen() {
  const engine = useEngine()
  const { settings, update } = useSettings()
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [moduleName, setModuleName] = useState<string | null>(null)
  const [books, setBooks] = useState<BibleBook[]>([])
  const [book, setBook] = useState<BibleBook | null>(null)
  const [chapter, setChapter] = useState(1)
  const [content, setContent] = useState<ChapterContent | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTab, setPickerTab] = useState<'books' | 'chapters'>('books')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalVerse, setModalVerse] = useState<VerseText | null>(null)
  const [openFootnote, setOpenFootnote] = useState<Footnote | null>(null)
  const [focusedVerse, setFocusedVerse] = useState<number | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Antes de cualquier return temprano (regla de hooks): viewport para columnas.
  const { width: windowWidth } = useWindowDimensions()
  // TTS bimodal (F3): versiculo en curso + palabra del karaoke + estado.
  const [ttsState, setTtsState] = useState<TTSState>('idle')
  const [ttsVerseIndex, setTtsVerseIndex] = useState<number | null>(null)
  const [ttsWordIndex, setTtsWordIndex] = useState<number | null>(null)
  const [ttsRate, setTtsRate] = useState(1)
  const [ttsError, setTtsError] = useState<string | null>(null)

  const handleRef = useRef<OpenedBible | null>(null)
  const moduleIdRef = useRef<string | null>(null)
  // Deep-link ?verse=N (desde Buscar): enfoca ese versiculo al cargar.
  const searchParams = useLocalSearchParams<{ verse?: string }>()
  const linkedVerse =
    typeof searchParams.verse === 'string' ? Number.parseInt(searchParams.verse, 10) : NaN
  const ttsRef = useRef<TTSOrchestrator | null>(null)
  const ttsPassageRef = useRef<Array<{ verse: number; text: string }>>([])
  const scrollRef = useRef<ScrollView | null>(null)
  const verseYRef = useRef(new Map<number, number>())
  // El long-press sobre una nota abre su tooltip; evita que el long-press
  // del versiculo (VerseModal) dispare a la vez.
  const suppressVerseModalUntil = useRef(0)

  const openFirstBible = useCallback(async () => {
    const installed = await engine.registry.list()
    const first = installed.filter((m) => m.type === 'bible' && m.enabled)[0]
    if (!first) {
      handleRef.current = null
      moduleIdRef.current = null
      setModuleId(null)
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
    setModuleId(first.id)
    setModuleName(first.name)
    setBooks(list)
    // Reanudar lectura: restaura (libro, capitulo) guardados de este modulo.
    const saved = await loadReadingPosition(engine.ports.fs, engine.sandboxDir)
    const restored =
      saved !== null && saved.moduleId === first.id
        ? list.find((b) => b.osisCode === saved.osisCode) ?? null
        : null
    if (restored !== null && saved !== null && saved.chapter <= restored.chapterCount) {
      setBook(restored)
      setChapter(saved.chapter)
      setFocusedVerse(null)
    } else {
      setBook((prev) => list.find((b) => b.osisCode === prev?.osisCode) ?? list[0] ?? null)
    }
  }, [engine])

  // Al enfocar: abre la primera Biblia si no hay ninguna abierta (p. ej.
  // instalada desde Biblioteca mientras Leer mostraba el empty state).
  // Con modulo ya abierto no hace nada (openFirstBible retorna temprano).
  useFocusEffect(
    useCallback(() => {
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
    }, [openFirstBible]),
  )

  useEffect(() => {
    let active = true
    void loadBookmarks(engine.ports.fs, engine.sandboxDir)
      .then((b) => {
        if (active) setBookmarks(b)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [engine])

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
        if (!active) return
        setContent(c)
        const linked = Number.isInteger(linkedVerse) && c.verses.some((v) => v.verse === linkedVerse)
        setFocusedVerse(linked ? linkedVerse : (c.verses[0]?.verse ?? null))
        if (linked) {
          // Espera al layout para el autoscroll al versiculo enlazado.
          setTimeout(() => {
            const y = verseYRef.current.get(linkedVerse)
            if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true })
          }, 350)
        }
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

  // Posicion persistente (best-effort, nunca bloquea la lectura).
  useEffect(() => {
    if (moduleId === null || book === null) return
    void saveReadingPosition(engine.ports.fs, engine.sandboxDir, {
      moduleId,
      osisCode: book.osisCode,
      chapter,
    })
  }, [engine, moduleId, book, chapter])

  const stopTts = useCallback(() => {
    ttsRef.current?.dispose()
    ttsRef.current = null
    ttsPassageRef.current = []
    setTtsVerseIndex(null)
    setTtsWordIndex(null)
    setTtsState('idle')
  }, [])

  // Cambiar de capitulo/modulo detiene la narracion (el pasaje ya no vale).
  useEffect(() => {
    stopTts()
    verseYRef.current.clear()
  }, [content, stopTts])

  useEffect(() => {
    return () => {
      ttsRef.current?.dispose()
      ttsRef.current = null
    }
  }, [])

  const startTts = useCallback(
    (fromIndex: number, rate: number) => {
      if (content === null || book === null) return
      ttsRef.current?.dispose()
      setTtsError(null)
      const items = content.verses.map((v) => ({ verse: v.verse, text: v.text }))
      ttsPassageRef.current = items
      const orch = new TTSOrchestrator(
        speechEngine,
        { book: book.osisCode, chapter, items },
        { rate, lang: 'en' },
        {
          onVerseStart: (verse, index) => {
            setTtsVerseIndex(index)
            setTtsWordIndex(null)
            setFocusedVerse(verse)
            const y = verseYRef.current.get(verse)
            if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true })
          },
          onBoundary: (_verse, index, boundary) => {
            const text = ttsPassageRef.current[index]?.text
            if (text === undefined) return
            setTtsVerseIndex(index)
            setTtsWordIndex(findWordIndexAtOffset(text, boundary.charIndex))
          },
          onStateChange: (s) => {
            setTtsState(s)
            if (s === 'finished' || s === 'stopped') {
              setTtsVerseIndex(null)
              setTtsWordIndex(null)
            }
          },
          onFinish: () => {},
          onError: (e) => setTtsError(e.message),
        },
      )
      ttsRef.current = orch
      // seekToIndex en idle reposiciona sin arrancar; play() narra desde ahi.
      if (fromIndex > 0 && items.length > 0) {
        orch.seekToIndex(Math.min(fromIndex, items.length - 1))
      }
      orch.play()
      setTtsState(orch.state)
    },
    [book, chapter, content],
  )

  const toggleTts = useCallback(() => {
    const orch = ttsRef.current
    if (ttsState === 'playing') {
      orch?.pause()
      return
    }
    if (ttsState === 'paused') {
      orch?.resume()
      return
    }
    // idle/stopped/finished: arrancar desde el versiculo enfocado si lo hay.
    let fromIndex = 0
    if (content !== null && focusedVerse !== null) {
      const i = content.verses.findIndex((v) => v.verse === focusedVerse)
      if (i >= 0) fromIndex = i
    }
    startTts(fromIndex, ttsRate)
  }, [content, focusedVerse, startTts, ttsRate, ttsState])

  const cycleTtsRate = useCallback(() => {
    const RATES = [0.85, 1, 1.25]
    const next = RATES[(RATES.indexOf(ttsRate) + 1) % RATES.length] ?? 1
    setTtsRate(next)
    // La voz se fija al construir el orquestador: si suena, reinicia ahi mismo.
    if (ttsState === 'playing' || ttsState === 'paused') {
      const at = ttsVerseIndex ?? 0
      startTts(at, next)
    }
  }, [startTts, ttsRate, ttsState, ttsVerseIndex])

  const bookmarkSet = useMemo(
    () => new Set(bookmarks.map((b) => bookmarkKey(b))),
    [bookmarks],
  )

  const toggleBookmark = useCallback(
    (verse: VerseText) => {
      if (moduleId === null || book === null) return
      setBookmarks((prev) => {
        const key = bookmarkKey({ moduleId, osisCode: book.osisCode, chapter, verse: verse.verse })
        const next = prev.some((b) => bookmarkKey(b) === key)
          ? prev.filter((b) => bookmarkKey(b) !== key)
          : [
              ...prev,
              {
                moduleId,
                osisCode: book.osisCode,
                chapter,
                verse: verse.verse,
                verseEnd: verse.verseEnd,
                createdAt: Date.now(),
              },
            ]
        void saveBookmarks(engine.ports.fs, engine.sandboxDir, next)
        return next
      })
    },
    [engine, moduleId, book, chapter],
  )

  const fontFamily = FONT_FAMILY_NAMES[settings.fontFamily]
  // Lectura simple: minimos de legibilidad AAA, sin adornos.
  const simpleMode = settings.simpleReadingMode
  const fontSize = simpleMode ? Math.max(settings.fontSize, 18) : settings.fontSize
  const lineHeight = simpleMode ? Math.max(settings.lineHeight, 1.6) : settings.lineHeight
  const useBionic = settings.bionicReading && !simpleMode
  const useSyllabic = settings.syllablePoints && !simpleMode
  const showFootnotes = settings.footnotes && !simpleMode
  const items = content !== null ? buildChapterItems(content) : []
  const footnotesByVerse = useMemo(() => {
    const map = new Map<number, Footnote[]>()
    for (const f of content?.footnotes ?? []) {
      const list = map.get(f.verse) ?? []
      list.push(f)
      map.set(f.verse, list)
    }
    return map
  }, [content])

  const renderVerseText = (text: string, baseSize: number, mutedColor: string): ReactNode => {
    if (useBionic) {
      return toBionicSegments(text).map((s, k) => (
        <Text key={k} style={s.strong ? { fontWeight: '700' } : undefined}>
          {s.text}
        </Text>
      ))
    }
    if (useSyllabic) {
      return toSyllabicText(text)
    }
    return text
  }

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

  const baseTextStyle = {
    fontFamily,
    fontSize,
    lineHeight: fontSize * lineHeight,
    letterSpacing: settings.letterSpacing,
  }
  // Columnas 1/2/auto (F2, foco Android+Web): en ScrollView continuo se aplican
  // como ancho maximo + multicolumna web. Nativo: 1 columna (2/auto => ancho
  // amplio centrado). Web: 2/auto-ancho usan CSS columns. La paginacion discreta
  // con presupuesto de alto sigue pendiente del motor de paginacion.
  const wideWeb = Platform.OS === 'web' && windowWidth >= 900
  const twoColWeb = settings.columns === '2' || (settings.columns === 'auto' && wideWeb)
  const readerMaxWidth =
    settings.columns === '1' ? 680 : settings.columns === '2' ? 1100 : wideWeb ? 1100 : 800
  const readerBodyStyle =
    Platform.OS === 'web' && twoColWeb
      ? { columnCount: 2, columnGap: 32 } as const
      : undefined
  const verseNumbersColor = THEME_TOKENS[settings.theme].readerMuted
  const chapterNumbers = book !== null ? Array.from({ length: book.chapterCount }, (_, k) => k + 1) : []

  return (
    <View className="flex-1 bg-reader-bg">
      <View className="gap-2 border-b border-reader-border px-4 pb-2 pt-1">
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir libro"
            onPress={() => {
              setPickerTab('books')
              setPickerOpen(true)
            }}
            className="min-h-[44px] flex-1 flex-row items-center justify-center rounded-xl bg-hover px-4"
          >
            <Text className="text-base font-semibold text-reader-text">
              {book !== null ? `${book.name} ${String(chapter)}` : 'Elegir libro'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes de lectura"
            onPress={() => setSettingsOpen(true)}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover px-3 active:opacity-70"
          >
            <Text className="text-base font-bold text-reader-text">Aa</Text>
          </Pressable>
        </View>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Elegir capítulo"
            onPress={() => {
              setPickerTab('chapters')
              setPickerOpen(true)
            }}
            className="min-h-[44px] items-center justify-center rounded-xl px-3 active:bg-hover"
          >
            <Text className="text-sm text-reader-muted">
              {book !== null ? `${book.name} ${String(chapter)} / ${String(book.chapterCount)}` : ''}
            </Text>
          </Pressable>
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
        <View className="flex-row items-center justify-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              ttsState === 'playing' ? 'Pausar lectura en voz alta' : 'Leer en voz alta'
            }
            onPress={toggleTts}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-accent px-4 active:opacity-70"
          >
            <Text className="text-base font-bold text-accent-fg">
              {ttsState === 'playing' ? '⏸' : ttsState === 'paused' ? '▶' : '🔊'}
            </Text>
          </Pressable>
          {ttsState === 'playing' || ttsState === 'paused' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Detener lectura en voz alta"
              onPress={stopTts}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover px-4 active:opacity-70"
            >
              <Text className="text-base font-bold text-reader-text">■</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Velocidad de lectura ${ttsRate.toFixed(2)}x, toca para cambiar`}
            onPress={cycleTtsRate}
            className="min-h-[44px] items-center justify-center rounded-xl bg-hover px-4 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-reader-text">{`${ttsRate.toFixed(2)}×`}</Text>
          </Pressable>
          <Text className="text-xs text-reader-muted">
            {ttsState === 'playing'
              ? ttsVerseIndex !== null && content !== null
                ? `Leyendo v.${String(content.verses[ttsVerseIndex]?.verse ?? '')}`
                : 'Leyendo…'
              : ttsState === 'paused'
                ? 'Pausado'
                : ttsError !== null
                  ? ttsError
                  : 'TTS'}
          </Text>
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
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="px-5 pb-10 pt-3"
          contentContainerStyle={{ alignItems: 'center' }}
        >
          <View style={{ width: '100%', maxWidth: readerMaxWidth }}>
          <Text style={[baseTextStyle, readerBodyStyle]} className="text-reader-text">
            {items.map((item, i) =>
              item.kind === 'heading' ? (
                <Text key={`h-${String(i)}`}>
                  {'\n\n'}
                  <Text style={{ fontWeight: '700', color: verseNumbersColor }}>{item.heading.title}</Text>
                  {'\n'}
                </Text>
              ) : (
                <VerseRow
                  key={`v-${String(i)}`}
                  verse={content.verses[item.verseIndex]}
                  bookName={content.book.name}
                  chapter={chapter}
                  baseStyle={baseTextStyle}
                  verseNumberColor={verseNumbersColor}
                  showVerseNumbers={settings.verseNumbers}
                  footnotes={footnotesByVerse.get(content.verses[item.verseIndex]?.verse ?? -1) ?? []}
                  showFootnotes={showFootnotes}
                  bookmarked={                    moduleId !== null &&
                    book !== null &&
                    bookmarkSet.has(
                      bookmarkKey({
                        moduleId,
                        osisCode: book.osisCode,
                        chapter,
                        verse: content.verses[item.verseIndex]?.verse ?? -1,
                      }),
                    )
                  }
                  dimmed={
                    settings.lineFocus &&
                    focusedVerse !== null &&
                    content.verses[item.verseIndex]?.verse !== focusedVerse
                  }
                  onFocus={() => {
                    const v = content.verses[item.verseIndex]?.verse ?? null
                    setFocusedVerse(v)
                    // Tocar otro versiculo mientras suena salta la narracion ahi.
                    if (ttsState === 'playing' && ttsRef.current !== null) {
                      ttsRef.current.seekToIndex(item.verseIndex)
                    }
                  }}
                  onOpenModal={() => {
                    if (Date.now() < suppressVerseModalUntil.current) return
                    const v = content.verses[item.verseIndex]
                    if (v) {
                      setFocusedVerse(v.verse)
                      setModalVerse(v)
                    }
                  }}
                  onOpenFootnote={setOpenFootnote}
                  onFootnotePressStart={() => {
                    suppressVerseModalUntil.current = Date.now() + 600
                  }}
                  renderText={renderVerseText}
                  ttsActive={ttsVerseIndex === item.verseIndex && ttsState === 'playing'}
                  ttsWord={ttsVerseIndex === item.verseIndex ? ttsWordIndex : null}
                  ttsHighlightColor={THEME_TOKENS[settings.theme].accentSubtle}
                  onMeasureY={(y) => {
                    const v = content.verses[item.verseIndex]?.verse
                    if (v !== undefined) verseYRef.current.set(v, y)
                  }}
                />
              ),
            )}
          </Text>
          </View>
        </ScrollView>
      )}

      <PickerModal
        visible={pickerOpen}
        tab={pickerTab}
        onTabChange={setPickerTab}
        moduleName={moduleName}
        books={books}
        activeOsis={book?.osisCode ?? null}
        chapters={chapterNumbers}
        activeChapter={chapter}
        onPickBook={(b) => {
          setBook(b)
          setChapter(1)
          setPickerOpen(false)
        }}
        onPickChapter={(c) => {
          setChapter(c)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />

      <ReadingSettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <VerseModal
        verse={modalVerse}
        bookName={book?.name ?? ''}
        osisCode={book?.osisCode ?? ''}
        chapter={chapter}
        bookmarked={
          modalVerse !== null &&
          moduleId !== null &&
          book !== null &&
          bookmarkSet.has(
            bookmarkKey({ moduleId, osisCode: book.osisCode, chapter, verse: modalVerse.verse }),
          )
        }
        onToggleBookmark={() => {
          if (modalVerse) toggleBookmark(modalVerse)
        }}
        onClose={() => setModalVerse(null)}
      />

      <FootnoteTooltip footnote={openFootnote} onClose={() => setOpenFootnote(null)} />
    </View>
  )
}

interface VerseRowProps {
  verse: VerseText | undefined
  bookName: string
  chapter: number
  baseStyle: { fontFamily: string | undefined; fontSize: number; lineHeight: number; letterSpacing: number }
  verseNumberColor: string
  showVerseNumbers: boolean
  footnotes: Footnote[]
  showFootnotes: boolean
  bookmarked: boolean
  dimmed: boolean
  /** Karaoke TTS: resalta la palabra en curso del versiculo que suena. */
  ttsActive: boolean
  ttsWord: number | null
  ttsHighlightColor: string
  onMeasureY(y: number): void
  onFocus(): void
  onOpenModal(): void
  onOpenFootnote(f: Footnote): void
  onFootnotePressStart(): void
  renderText(text: string, baseSize: number, mutedColor: string): ReactNode
}

function VerseRow({
  verse,
  bookName,
  chapter,
  baseStyle,
  verseNumberColor,
  showVerseNumbers,
  footnotes,
  showFootnotes,
  bookmarked,
  dimmed,
  ttsActive,
  ttsWord,
  ttsHighlightColor,
  onMeasureY,
  onFocus,
  onOpenModal,
  onOpenFootnote,
  onFootnotePressStart,
  renderText,
}: VerseRowProps) {
  if (!verse) return null
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={verseRef(bookName, chapter, verse)}
      accessibilityHint="Toca para enfocar, mantén para opciones del versículo"
      onPress={onFocus}
      onLongPress={onOpenModal}
      onLayout={(e) => onMeasureY(e.nativeEvent.layout.y)}
      delayLongPress={350}
      style={[
        dimmed ? { opacity: 0.35 } : undefined,
        ttsActive ? { backgroundColor: ttsHighlightColor } : undefined,
      ]}
    >
      <Text style={baseStyle} className="text-reader-text">
        {bookmarked ? <Text style={{ color: verseNumberColor }}>{'◆ '}</Text> : null}
        {showVerseNumbers ? (
          <Text style={{ fontSize: baseStyle.fontSize * 0.65, color: verseNumberColor }}>
            {' '}
            {verseLabel(verse)}{' '}
          </Text>
        ) : null}
        {ttsActive ? (
          <KaraokeText text={verse.text} activeWord={ttsWord} baseSize={baseStyle.fontSize} />
        ) : (
          renderText(verse.text, baseStyle.fontSize, verseNumberColor)
        )}
        {showFootnotes
          ? footnotes.map((f, k) => (
              <Text
                key={k}
                style={{ fontSize: baseStyle.fontSize * 0.65, color: verseNumberColor }}
                onPress={() => onOpenFootnote(f)}
                onLongPress={() => {
                  onFootnotePressStart()
                  onOpenFootnote(f)
                }}
                accessibilityRole="button"
                accessibilityLabel={`Nota al pie ${f.caller}`}
                accessibilityHint="Toca o mantén para leer la nota"
              >
                {' ['}
                {f.caller}
                {']'}
              </Text>
            ))
          : null}
        {' '}
      </Text>
    </Pressable>
  )
}

/** Palabra-por-palabra del karaoke TTS (read-aloud): boundary -> palabra activa. */
function KaraokeText({
  text,
  activeWord,
  baseSize,
}: {
  text: string
  activeWord: number | null
  baseSize: number
}) {
  const words = splitWords(text)
  return (
    <Text>
      {words.map((w, i) => (
        <Text
          key={i}
          style={i === activeWord ? { fontWeight: '700', fontSize: baseSize * 1.06 } : undefined}
        >
          {w.word}
          {' '}
        </Text>
      ))}
    </Text>
  )
}

interface PickerModalProps {
  visible: boolean
  tab: 'books' | 'chapters'
  onTabChange(tab: 'books' | 'chapters'): void
  moduleName: string
  books: BibleBook[]
  activeOsis: string | null
  chapters: number[]
  activeChapter: number
  onPickBook(b: BibleBook): void
  onPickChapter(c: number): void
  onClose(): void
}

function PickerModal({
  visible,
  tab,
  onTabChange,
  moduleName,
  books,
  activeOsis,
  chapters,
  activeChapter,
  onPickBook,
  onPickChapter,
  onClose,
}: PickerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] rounded-t-2xl border-t border-reader-border bg-reader-bg pt-4">
          <View className="flex-row items-center justify-between px-5 pb-2">
            <Text className="text-lg font-bold text-reader-text">{moduleName}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector"
              onPress={onClose}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:bg-hover"
            >
              <Text className="text-xl text-reader-text">✕</Text>
            </Pressable>
          </View>
          <View className="flex-row gap-2 px-5 pb-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver libros"
              onPress={() => onTabChange('books')}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 ${tab === 'books' ? 'bg-accent' : 'bg-hover'}`}
            >
              <Text className={`text-sm font-semibold ${tab === 'books' ? 'text-accent-fg' : 'text-reader-text'}`}>
                Libros
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver capítulos"
              onPress={() => onTabChange('chapters')}
              className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-4 ${tab === 'chapters' ? 'bg-accent' : 'bg-hover'}`}
            >
              <Text className={`text-sm font-semibold ${tab === 'chapters' ? 'text-accent-fg' : 'text-reader-text'}`}>
                Capítulos
              </Text>
            </Pressable>
          </View>
          {tab === 'books' ? (
            <FlatList
              key="books-1col"
              data={books}
              keyExtractor={(b) => String(b.bookId)}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.name}`}
                  onPress={() => onPickBook(item)}
                  className={`min-h-[44px] flex-row items-center justify-between px-5 py-2 active:bg-hover ${activeOsis === item.osisCode ? 'bg-hover' : ''}`}
                >
                  <Text className="text-base text-reader-text">{item.name}</Text>
                  <Text className="text-xs text-reader-muted">{String(item.chapterCount)} cap.</Text>
                </Pressable>
              )}
            />
          ) : (
            <FlatList
              key="chapters-5col"
              data={chapters}
              keyExtractor={(c) => String(c)}
              numColumns={5}
              contentContainerClassName="px-4 pb-6 pt-1"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ir al capítulo ${String(item)}`}
                  onPress={() => onPickChapter(item)}
                  className={`m-1 min-h-[44px] flex-1 items-center justify-center rounded-xl ${item === activeChapter ? 'bg-accent' : 'bg-hover'}`}
                >
                  <Text className={`text-base ${item === activeChapter ? 'font-bold text-accent-fg' : 'text-reader-text'}`}>
                    {String(item)}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

function ReadingSettingsSheet({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const { settings, update } = useSettings()
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] rounded-t-2xl border-t border-reader-border bg-reader-bg pt-4">
          <View className="flex-row items-center justify-between px-5 pb-2">
            <Text className="text-lg font-bold text-reader-text">Ajustes de lectura</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar ajustes de lectura"
              onPress={onClose}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:bg-hover"
            >
              <Text className="text-xl text-reader-text">✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="gap-4 px-5 pb-8">
            <SettingsGroup label="Tema">
              <View className="flex-row gap-2">
                {THEME_OPTIONS.map((t) => (
                  <Pressable
                    key={t.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Tema ${t.label}`}
                    onPress={() => update({ theme: t.id })}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-2 ${settings.theme === t.id ? 'bg-accent' : 'bg-hover'}`}
                  >
                    <Text className={`text-sm font-semibold ${settings.theme === t.id ? 'text-accent-fg' : 'text-reader-text'}`}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingsGroup>
            <SettingsGroup label="Fuente">
              <View className="flex-row flex-wrap gap-2">
                {FONT_OPTIONS.map((f) => (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Fuente ${f.label}`}
                    onPress={() => update({ fontFamily: f.id })}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-2 ${settings.fontFamily === f.id ? 'bg-accent' : 'bg-hover'}`}
                  >
                    <Text className={`text-sm font-semibold ${settings.fontFamily === f.id ? 'text-accent-fg' : 'text-reader-text'}`}>
                      {f.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingsGroup>
            <StepperRow
              label="Tamaño"
              value={`${String(settings.fontSize)} pt`}
              onLess={() => update({ fontSize: settings.fontSize - 1 })}
              onMore={() => update({ fontSize: settings.fontSize + 1 })}
              lessLabel="Reducir tamaño de letra"
              moreLabel="Aumentar tamaño de letra"
            />
            <StepperRow
              label="Interlineado"
              value={settings.lineHeight.toFixed(1)}
              onLess={() => update({ lineHeight: Math.round((settings.lineHeight - 0.1) * 10) / 10 })}
              onMore={() => update({ lineHeight: Math.round((settings.lineHeight + 0.1) * 10) / 10 })}
              lessLabel="Reducir interlineado"
              moreLabel="Aumentar interlineado"
            />
            <StepperRow
              label="Espaciado"
              value={settings.letterSpacing.toFixed(1)}
              onLess={() => update({ letterSpacing: Math.round((settings.letterSpacing - 0.1) * 10) / 10 })}
              onMore={() => update({ letterSpacing: Math.round((settings.letterSpacing + 0.1) * 10) / 10 })}
              lessLabel="Reducir espaciado de letras"
              moreLabel="Aumentar espaciado de letras"
            />
            <SettingsGroup label="Mostrar">
              <ToggleRow
                label="Números de versículo"
                value={settings.verseNumbers}
                onToggle={() => update({ verseNumbers: !settings.verseNumbers })}
              />
              <ToggleRow
                label="Notas al pie"
                value={settings.footnotes}
                onToggle={() => update({ footnotes: !settings.footnotes })}
              />
              <Text className="text-sm text-reader-muted">
                Columnas (en móvil 1 columna; en web 2 divide el texto)
              </Text>
              <View className="flex-row gap-2">
                {COLUMN_OPTIONS.map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Columnas ${c.label}`}
                    onPress={() => update({ columns: c.id })}
                    className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-2 ${settings.columns === c.id ? 'bg-accent' : 'bg-hover'}`}
                  >
                    <Text className={`text-sm font-semibold ${settings.columns === c.id ? 'text-accent-fg' : 'text-reader-text'}`}>
                      {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </SettingsGroup>
            <SettingsGroup label="Ayudas de lectura">
              <ToggleRow
                label="Lectura biónica"
                value={settings.bionicReading}
                onToggle={() => update({ bionicReading: !settings.bionicReading })}
              />
              <ToggleRow
                label="Puntos silábicos"
                value={settings.syllablePoints}
                onToggle={() => update({ syllablePoints: !settings.syllablePoints })}
              />
              <ToggleRow
                label="Line focus (TDAH)"
                value={settings.lineFocus}
                onToggle={() => update({ lineFocus: !settings.lineFocus })}
              />
              <ToggleRow
                label="Lectura simple (AAA)"
                value={settings.simpleReadingMode}
                onToggle={() => update({ simpleReadingMode: !settings.simpleReadingMode })}
              />
            </SettingsGroup>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase text-reader-muted">{label}</Text>
      {children}
    </View>
  )
}

interface StepperRowProps {
  label: string
  value: string
  onLess(): void
  onMore(): void
  lessLabel: string
  moreLabel: string
}

function StepperRow({ label, value, onLess, onMore, lessLabel, moreLabel }: StepperRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Text className="flex-1 text-sm text-reader-text">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lessLabel}
        onPress={onLess}
        className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover active:opacity-70"
      >
        <Text className="text-lg text-reader-text">−</Text>
      </Pressable>
      <Text className="min-w-[64px] text-center text-sm font-semibold text-reader-text">{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={moreLabel}
        onPress={onMore}
        className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-hover active:opacity-70"
      >
        <Text className="text-lg text-reader-text">+</Text>
      </Pressable>
    </View>
  )
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle(): void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={onToggle}
      className="min-h-[44px] flex-row items-center justify-between rounded-xl bg-hover px-4"
    >
      <Text className="text-sm text-reader-text">{label}</Text>
      <Text className="text-sm font-bold text-reader-text">{value ? 'Sí' : 'No'}</Text>
    </Pressable>
  )
}

interface VerseModalProps {
  verse: VerseText | null
  bookName: string
  osisCode: string
  chapter: number
  bookmarked: boolean
  onToggleBookmark(): void
  onClose(): void
}

function VerseModal({ verse, bookName, osisCode, chapter, bookmarked, onToggleBookmark, onClose }: VerseModalProps) {
  return (
    <Modal visible={verse !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="gap-3 rounded-t-2xl border-t border-reader-border bg-reader-bg p-5 pb-8">
          <Text className="text-lg font-bold text-reader-text">
            {verse !== null ? verseRef(bookName, chapter, verse) : ''}
          </Text>
          <Text className="text-sm text-reader-muted" numberOfLines={4}>
            {verse?.text ?? ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir en Estudio con comentario y diccionario"
            onPress={() => {
              if (verse !== null && osisCode.length > 0) {
                onClose()
                router.push({
                  pathname: '/estudio',
                  params: { osis: osisCode, chapter: String(chapter), verse: String(verse.verse) },
                })
              }
            }}
            className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-4"
          >
            <Text className="text-sm font-semibold text-accent-fg">Estudiar pasaje</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Quitar marcador' : 'Añadir marcador'}
            onPress={() => {
              onToggleBookmark()
              onClose()
            }}
            className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-4"
          >
            <Text className="text-sm font-semibold text-accent-fg">
              {bookmarked ? 'Quitar marcador ◆' : 'Añadir marcador'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar opciones del versículo"
            onPress={onClose}
            className="min-h-[44px] items-center justify-center rounded-xl border border-reader-border px-4"
          >
            <Text className="text-sm font-semibold text-reader-text">Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function FootnoteTooltip({ footnote, onClose }: { footnote: Footnote | null; onClose(): void }) {
  return (
    <Modal visible={footnote !== null} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar nota al pie"
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/40 p-8"
      >
        <View className="w-full gap-2 rounded-2xl border border-reader-border bg-reader-bg p-4">
          <Text className="text-xs font-bold uppercase text-reader-muted">
            Nota {footnote?.caller ?? ''}
          </Text>
          <Text className="text-sm text-reader-text">{footnote?.text ?? ''}</Text>
          <View className="min-h-[44px] items-center justify-center rounded-xl bg-hover">
            <Text className="text-sm font-semibold text-reader-text">Cerrar</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}
