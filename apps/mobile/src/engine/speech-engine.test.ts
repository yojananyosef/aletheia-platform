import { describe, expect, test } from 'bun:test'
import { TTSOrchestrator } from '@aletheia/core'
import {
  createSpeechEngine,
  type SpeechBackend,
  type SpeechBackendSpeakOptions,
} from './speech-engine'

/** Falso con la semantica real de expo-speech: stop() global + onStopped. */
class FakeBackend implements SpeechBackend {
  calls: Array<{ text: string; options: SpeechBackendSpeakOptions }> = []
  paused = false
  supportPause: boolean
  constructor(supportPause = true) {
    this.supportPause = supportPause
  }

  speak(text: string, options: SpeechBackendSpeakOptions): void {
    this.calls.push({ text, options })
  }

  stop(): void {
    // El backend real emite onStopped en la utterance abortada.
    this.calls.at(-1)?.options.onStopped()
  }

  pause(): void {
    if (!this.supportPause) throw new Error('pause no soportado')
    this.paused = true
  }

  resume(): void {
    if (!this.supportPause) throw new Error('resume no soportado')
    this.paused = false
  }
}

describe('createSpeechEngine', () => {
  test('mapea rate/pitch/lang/voiceId al backend', () => {
    const backend = new FakeBackend()
    const engine = createSpeechEngine(backend, { platformSupportsPause: true })
    const handle = engine.speak('hello', { rate: 0.9, pitch: 1.1, lang: 'en', voiceId: 'v1' }, {})
    expect(backend.calls).toHaveLength(1)
    expect(backend.calls[0]?.options.rate).toBe(0.9)
    expect(backend.calls[0]?.options.pitch).toBe(1.1)
    expect(backend.calls[0]?.options.language).toBe('en')
    expect(backend.calls[0]?.options.voice).toBe('v1')
    handle.cancel()
  })

  test('onDone/onBoundary se propagan; onStopped tras stop() es silencioso', () => {
    const backend = new FakeBackend()
    const engine = createSpeechEngine(backend, { platformSupportsPause: true })
    let done = 0
    let errors = 0
    const boundaries: Array<[number, number]> = []
    const handle = engine.speak(
      'In the beginning',
      {},
      {
        onBoundary: (b) => boundaries.push([b.charIndex, b.charLength ?? -1]),
        onEnd: () => done++,
        onError: () => errors++,
      },
    )
    backend.calls[0]?.options.onBoundary?.(3, 3)
    expect(boundaries).toEqual([[3, 3]])
    backend.calls[0]?.options.onDone()
    expect(done).toBe(1)
    handle.cancel()
    // stop() global emite onStopped en la utterance: silencioso, sin errores.
    expect(errors).toBe(0)
    expect(done).toBe(1)
  })

  test('carrera pausa-vs-generacion: callbacks tardios tras cancel() se descartan', () => {
    const backend = new FakeBackend()
    const engine = createSpeechEngine(backend, { platformSupportsPause: true })
    let done = 0
    let errors = 0
    const handle = engine.speak('verse one', {}, { onEnd: () => done++, onError: () => errors++ })
    handle.cancel()
    // El backend emite tarde onDone/onError de la generacion cancelada.
    backend.calls[0]?.options.onDone()
    backend.calls[0]?.options.onError(new Error('spurious after stop'))
    expect(done).toBe(0)
    expect(errors).toBe(0)
  })

  test('sin pause en backend (Android): el handle la omite (fallback del orquestador)', () => {
    const backend: SpeechBackend = {
      speak: () => {},
      stop: () => {},
    }
    const engine = createSpeechEngine(backend, { platformSupportsPause: false })
    const handle = engine.speak('hola', {}, {})
    expect(handle.pause).toBeUndefined()
    expect(handle.resume).toBeUndefined()
    handle.cancel()
  })

  test('integracion con el orquestador: stop mid-utterance no avanza ni falla', () => {
    const backend = new FakeBackend()
    const engine = createSpeechEngine(backend, { platformSupportsPause: false })
    const started: number[] = []
    const errors: Error[] = []
    const orch = new TTSOrchestrator(
      engine,
      {
        book: 'Gen',
        chapter: 1,
        items: [
          { verse: 1, text: 'verse one' },
          { verse: 2, text: 'verse two' },
        ],
      },
      {},
      {
        onVerseStart: (_v, i) => started.push(i),
        onError: (e) => errors.push(e),
      },
    )
    orch.play()
    orch.stop()
    // Callbacks espurios de la utterance abortada.
    backend.calls[0]?.options.onDone()
    backend.calls[0]?.options.onError(new Error('spurious'))
    expect(started).toEqual([0])
    expect(errors).toEqual([])
    expect(orch.state).toBe('stopped')
  })
})
