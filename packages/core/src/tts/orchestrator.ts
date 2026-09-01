import type { TTSBoundary, TTSEngine, TTSSpeakHandle, TTSSpeakOptions } from './engine'

export type TTSState = 'idle' | 'playing' | 'paused' | 'stopped' | 'finished'

export interface TTSPassageItem {
  verse: number
  text: string
}

export interface TTSPassage {
  book: string
  chapter: number
  items: TTSPassageItem[]
}

export interface TTSOrchestratorEvents {
  onVerseStart?(verse: number, index: number): void
  onVerseEnd?(verse: number, index: number): void
  onBoundary?(verse: number, index: number, boundary: TTSBoundary): void
  onStateChange?(state: TTSState): void
  onFinish?(): void
  onError?(error: Error): void
}

export interface TTSOrchestratorConfig extends TTSSpeakOptions {
  /** versiculo inicial (indice sobre passage.items) */
  startIndex?: number
}

/**
 * Cola por versiculo con avance automatico y boundary events para resaltado bimodal.
 *
 * Leccion del fix de pausa del legacy: toda cancelacion usa una referencia local al
 * handle en curso + un contador de generacion. Los callbacks de generaciones pasadas
 * (onEnd/onError espurios que algunos engines emiten tras cancel()) se descartan sin
 * propagar errores de UI.
 */
export class TTSOrchestrator {
  private readonly engine: TTSEngine
  private readonly passage: TTSPassage
  private readonly events: TTSOrchestratorEvents
  private readonly voice: TTSSpeakOptions

  private stateValue: TTSState = 'idle'
  private currentIndex: number
  private currentHandle: TTSSpeakHandle | null = null
  private generation = 0

  constructor(engine: TTSEngine, passage: TTSPassage, config: TTSOrchestratorConfig = {}, events: TTSOrchestratorEvents = {}) {
    this.engine = engine
    this.passage = passage
    this.events = events
    this.voice = { rate: config.rate, pitch: config.pitch, lang: config.lang, voiceId: config.voiceId }
    const start = config.startIndex ?? 0
    this.currentIndex =
      Number.isInteger(start) && start >= 0 && start < Math.max(passage.items.length, 1) ? start : 0
  }

  get state(): TTSState {
    return this.stateValue
  }

  get currentVerseIndex(): number {
    return this.currentIndex
  }

  get currentVerse(): number | undefined {
    return this.passage.items[this.currentIndex]?.verse
  }

  play(): void {
    if (this.stateValue === 'playing') return
    if (this.stateValue === 'finished' || this.passage.items.length === 0) return
    if (this.stateValue === 'paused' && this.resumeEngine()) return
    this.setState('playing')
    this.speakCurrent()
  }

  pause(): void {
    if (this.stateValue !== 'playing') return
    const handle = this.currentHandle
    if (handle?.pause) {
      handle.pause()
      this.setState('paused')
      return
    }
    // Fallback sin pausa de engine: cancelar y re-narrar el versiculo al reanudar.
    this.cancelCurrent()
    this.setState('paused')
  }

  resume(): void {
    if (this.stateValue !== 'paused') return
    if (this.resumeEngine()) return
    this.setState('playing')
    this.speakCurrent()
  }

  stop(): void {
    if (this.stateValue === 'idle' || this.stateValue === 'finished') return
    this.cancelCurrent()
    this.setState('stopped')
  }

  /** Reinicia la narracion desde un versiculo (seek del resaltado bimodal). */
  seekToIndex(index: number): void {
    if (index < 0 || index >= this.passage.items.length) return
    const wasPlaying = this.stateValue === 'playing'
    this.cancelCurrent()
    this.currentIndex = index
    if (wasPlaying) {
      this.setState('playing')
      this.speakCurrent()
    } else {
      this.setState('idle')
    }
  }

  dispose(): void {
    this.cancelCurrent()
    this.setState('stopped')
  }

  private resumeEngine(): boolean {
    const handle = this.currentHandle
    if (!handle?.resume) return false
    handle.resume()
    this.setState('playing')
    return true
  }

  private cancelCurrent(): void {
    // Bump de generacion ANTES de cancelar: cualquier callback en vuelo queda obsoleto.
    this.generation++
    const handle = this.currentHandle
    this.currentHandle = null
    try {
      handle?.cancel()
    } catch {
      // cancel() no debe romper el orquestador aunque el engine falle al abortar.
    }
  }

  private setState(state: TTSState): void {
    if (this.stateValue === state) return
    this.stateValue = state
    this.events.onStateChange?.(state)
  }

  private speakCurrent(): void {
    const item = this.passage.items[this.currentIndex]
    if (!item) {
      this.setState('finished')
      this.events.onFinish?.()
      return
    }
    const generation = this.generation
    const index = this.currentIndex
    this.events.onVerseStart?.(item.verse, index)
    this.currentHandle = this.engine.speak(item.text, this.voice, {
      onBoundary: (boundary) => {
        if (generation !== this.generation) return
        this.events.onBoundary?.(item.verse, index, boundary)
      },
      onEnd: () => {
        if (generation !== this.generation) return
        this.currentHandle = null
        this.events.onVerseEnd?.(item.verse, index)
        if (this.stateValue !== 'playing') return
        if (index + 1 < this.passage.items.length) {
          this.currentIndex = index + 1
          this.speakCurrent()
        } else {
          this.setState('finished')
          this.events.onFinish?.()
        }
      },
      onError: (error) => {
        if (generation !== this.generation) return
        // Cancelacion con referencia local ANTES de reportar: aborta el handle
        // del engine (los callbacks tardios quedan obsoletos por el generacion bump).
        this.cancelCurrent()
        this.setState('stopped')
        this.events.onError?.(error)
      },
    })
  }
}
