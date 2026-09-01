import { describe, expect, test } from 'bun:test'
import type { TTSBoundary, TTSEngine, TTSSpeakHandle, TTSSpeakOptions } from '../src/tts/engine'
import type { TTSEngineCallbacks } from '../src/tts/engine'
import { TTSOrchestrator } from '../src/tts/orchestrator'
import type { TTSState, TTSPassage } from '../src/tts/orchestrator'

interface ActiveUtterance {
  text: string
  options: TTSSpeakOptions
  callbacks: TTSEngineCallbacks
  handle: TTSSpeakHandle
  paused: boolean
}

class FakeEngine implements TTSEngine {
  readonly id = 'fake'
  active: ActiveUtterance[] = []
  /** textos de cada speak() (para detectar re-narraciones) */
  speakCalls: string[] = []
  /** handle de la ultima utterance (para acciones del test) */
  last: ActiveUtterance | null = null

  private drop(u: ActiveUtterance): void {
    const i = this.active.indexOf(u)
    if (i >= 0) this.active.splice(i, 1)
  }

  speak(text: string, options: TTSSpeakOptions, callbacks: TTSEngineCallbacks): TTSSpeakHandle {
    this.speakCalls.push(text)
    const u: ActiveUtterance = {
      text,
      options,
      callbacks,
      paused: false,
      handle: null as unknown as TTSSpeakHandle,
    }
    u.handle = {
      pause: () => {
        u.paused = true
      },
      resume: () => {
        u.paused = false
      },
      cancel: () => this.drop(u),
    }
    this.active.push(u)
    this.last = u
    return u.handle
  }

  emitBoundary(charIndex = 0, charLength?: number): void {
    const b: TTSBoundary = charLength === undefined ? { charIndex } : { charIndex, charLength }
    this.last?.callbacks.onBoundary?.(b)
  }

  complete(): void {
    const u = this.last
    if (!u) return
    this.drop(u)
    u.callbacks.onEnd?.()
  }

  fail(error: Error): void {
    this.last?.callbacks.onError?.(error)
  }
}

const passage: TTSPassage = {
  book: 'Gen',
  chapter: 1,
  items: [
    { verse: 1, text: 'In the beginning God created the heavens and the earth.' },
    { verse: 2, text: 'And the earth was waste and void; and darkness was upon the face of the deep.' },
    { verse: 3, text: 'And God said, Let there be light: and there was light.' },
  ],
}

describe('TTSOrchestrator', () => {
  test('narra la cola versiculo por versiculo con avance automatico', () => {
    const engine = new FakeEngine()
    const started: number[] = []
    const ended: number[] = []
    let finished = 0
    const states: TTSState[] = []
    const orch = new TTSOrchestrator(
      engine,
      passage,
      {},
      {
        onVerseStart: (_verse, index) => started.push(index),
        onVerseEnd: (_verse, index) => ended.push(index),
        onFinish: () => finished++,
        onStateChange: (s) => states.push(s),
      },
    )
    orch.play()
    expect(orch.state).toBe('playing')
    expect(engine.last?.text).toContain('In the beginning')
    engine.complete()
    engine.complete()
    engine.complete()
    expect(started).toEqual([0, 1, 2])
    expect(ended).toEqual([0, 1, 2])
    expect(finished).toBe(1)
    expect(orch.state).toBe('finished')
    expect(states).toEqual(['playing', 'finished'])
  })

  test('propaga boundary events asociados al versiculo en curso', () => {
    const engine = new FakeEngine()
    const boundaries: Array<[number, number, TTSBoundary]> = []
    const orch = new TTSOrchestrator(engine, passage, {}, {
      onBoundary: (verse, index, b) => boundaries.push([verse, index, b]),
    })
    orch.play()
    engine.emitBoundary(0, 2)
    expect(boundaries).toEqual([[1, 0, { charIndex: 0, charLength: 2 }]])
    engine.complete()
    engine.emitBoundary(5)
    expect(boundaries[1]).toEqual([2, 1, { charIndex: 5 }])
    orch.stop()
  })

  test('stop a mitad de generacion: cancela con referencia local y no propaga errores espurios', () => {
    const engine = new FakeEngine()
    const errors: Error[] = []
    const ended: number[] = []
    const started: number[] = []
    const orch = new TTSOrchestrator(engine, passage, {}, {
      onVerseStart: (_v, i) => started.push(i),
      onVerseEnd: (_v, i) => ended.push(i),
      onError: (e) => errors.push(e),
    })
    orch.play()
    const stale = engine.last
    orch.stop()
    expect(orch.state).toBe('stopped')
    // Callbacks espurios posteriores a cancel() (comportamiento observado en el legacy)
    stale?.callbacks.onEnd?.()
    stale?.callbacks.onError?.(new Error('spurious after cancel'))
    expect(errors).toEqual([])
    expect(started).toEqual([0])
    expect(ended).toEqual([])
    // no re-narra tras los callbacks espurios
    expect(engine.active).toEqual([])
  })

  test('pausa/reanuda con engine que soporta pause', () => {
    const engine = new FakeEngine()
    const orch = new TTSOrchestrator(engine, passage, {}, {})
    orch.play()
    orch.pause()
    expect(orch.state).toBe('paused')
    expect(engine.last?.paused).toBe(true)
    orch.resume()
    expect(orch.state).toBe('playing')
    expect(engine.last?.paused).toBe(false)
    engine.complete()
    // continua al siguiente versiculo, no re-narra el actual
    expect(engine.last?.text).toContain('waste and void')
    orch.stop()
  })

  test('pausa sin soporte de engine cancela y reanuda re-narrando el versiculo actual', () => {
    const engine = new FakeEngine()
    const limited: TTSEngine = {
      id: 'no-pause',
      speak: (text, options, callbacks) => {
        const h = engine.speak(text, options, callbacks)
        return { cancel: () => h.cancel() }
      },
    }
    const started: number[] = []
    const orch = new TTSOrchestrator(limited, passage, {}, {
      onVerseStart: (_v, i) => started.push(i),
    })
    orch.play()
    orch.pause()
    expect(orch.state).toBe('paused')
    expect(engine.active).toEqual([])
    orch.resume()
    expect(orch.state).toBe('playing')
    expect(started).toEqual([0, 0])
    orch.stop()
  })

  test('play en estado playing es no-op (sin doble cola)', () => {
    const engine = new FakeEngine()
    const orch = new TTSOrchestrator(engine, passage, {}, {})
    orch.play()
    orch.play()
    orch.play()
    expect(engine.active).toHaveLength(1)
    orch.stop()
  })

  test('stop tras finish es no-op y no re-narra', () => {
    const engine = new FakeEngine()
    const orch = new TTSOrchestrator(engine, passage, {}, {})
    orch.play()
    engine.complete()
    engine.complete()
    engine.complete()
    orch.stop()
    expect(orch.state).toBe('finished')
    expect(engine.active).toEqual([])
    expect(engine.speakCalls).toHaveLength(3)
  })

  test('pasa rate/pitch/lang al engine', () => {
    const engine = new FakeEngine()
    const orch = new TTSOrchestrator(engine, passage, { rate: 0.9, pitch: 1.1, lang: 'en' }, {})
    orch.play()
    expect(engine.last?.options).toEqual({ rate: 0.9, pitch: 1.1, lang: 'en' })
    orch.stop()
  })

  test('seekToIndex re-narrando si estaba en reproduccion', () => {
    const engine = new FakeEngine()
    const started: number[] = []
    const orch = new TTSOrchestrator(engine, passage, {}, {
      onVerseStart: (_v, i) => started.push(i),
    })
    orch.play()
    orch.seekToIndex(2)
    expect(started).toEqual([0, 2])
    expect(engine.last?.text).toContain('Let there be light')
    engine.complete()
    expect(orch.state).toBe('finished')
  })

  test('error real del engine detiene la cola y propaga un solo onError', () => {
    const engine = new FakeEngine()
    const errors: Error[] = []
    const states: TTSState[] = []
    const orch = new TTSOrchestrator(engine, passage, {}, {
      onError: (e) => errors.push(e),
      onStateChange: (s) => states.push(s),
    })
    orch.play()
    engine.fail(new Error('voice missing'))
    expect(errors).toHaveLength(1)
    expect(orch.state).toBe('stopped')
    // el onError tardio de la generacion cancelada no se propaga
    expect(engine.active).toEqual([])
  })
})
