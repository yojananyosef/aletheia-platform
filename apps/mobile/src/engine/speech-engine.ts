import type {
  TTSEngine,
  TTSEngineCallbacks,
  TTSSpeakHandle,
  TTSSpeakOptions,
} from '@aletheia/core'

/**
 * Backend minimo de sintesis. El adaptador de produccion (`expo-speech-backend`)
 * envuelve `expo-speech` (nativo + web SpeechSynthesis); los tests inyectan un
 * falso. La separacion existe porque `expo-speech` no se puede importar bajo
 * bun (modulo nativo) y este fichero debe seguir siendo testeable headless.
 */
export interface SpeechBackendVoice {
  identifier: string
  language: string
}

export interface SpeechBackendSpeakOptions {
  rate?: number | undefined
  pitch?: number | undefined
  language?: string | undefined
  voice?: string | undefined
  /** iOS: sesion de audio separada para ducking/interrupciones (defecto false). */
  useApplicationAudioSession?: boolean | undefined
  onDone(): void
  onStopped(): void
  onError(error: Error): void
  onBoundary?(charIndex: number, charLength: number): void
}

export interface SpeechBackend {
  speak(text: string, options: SpeechBackendSpeakOptions): void
  stop(): void
  pause?(): void
  resume?(): void
  getVoices?(): Promise<SpeechBackendVoice[]>
}

export interface SpeechEngineOptions extends TTSSpeakOptions {
  /**
   * false en Android (expo-speech no tiene pause ahi): el handle resultante
   * omite pause/resume y el orquestador aplica su fallback (cancelar +
   * re-narrar el versiculo al reanudar). true en iOS/web.
   */
  platformSupportsPause?: boolean | undefined
  useApplicationAudioSession?: boolean | undefined
}

/**
 * TTSEngine sobre un backend estilo expo-speech (F3, Android+web primero).
 *
 * Particularidades del backend real que este adaptador absorbe:
 * - `speak()` no devuelve handle: la utterance en curso se identifica por un
 *   id local monotonico; TODO callback de ids viejos (onDone/onStopped/onError
 *   tardios tras `stop()`) se descarta — test de carrera pausa-vs-generacion.
 * - `stop()` es global y dispara `onStopped` en la utterance abortada: se
 *   trata como cancelacion silenciosa, nunca como error de UI.
 * - Sin `pause` en el backend (Android) el handle tampoco lo expone y el
 *   TTSOrchestrator re-narra el versiculo al reanudar.
 */
export function createSpeechEngine(
  backend: SpeechBackend,
  defaults: SpeechEngineOptions = {},
): TTSEngine {
  const canPause =
    defaults.platformSupportsPause === true &&
    typeof backend.pause === 'function' &&
    typeof backend.resume === 'function'
  return {
    id: 'expo-speech',
    speak(text: string, options: TTSSpeakOptions, callbacks: TTSEngineCallbacks): TTSSpeakHandle {
      let alive = true
      const guard = <T extends unknown[]>(fn: ((...args: T) => void) | undefined) => {
        return (...args: T): void => {
          if (alive) fn?.(...args)
        }
      }
      const onDone = guard(callbacks.onEnd)
      const onError = guard(callbacks.onError)
      backend.speak(text, {
        rate: options.rate ?? defaults.rate,
        pitch: options.pitch ?? defaults.pitch,
        language: options.lang ?? defaults.lang,
        voice: options.voiceId ?? defaults.voiceId,
        useApplicationAudioSession: defaults.useApplicationAudioSession,
        onDone,
        // stop() global: la utterance abortada emite onStopped; si el id ya
        // murio (cancel/new speak) se ignora por el guard.
        onStopped: () => {},
        onError,
        onBoundary:
          callbacks.onBoundary !== undefined
            ? (charIndex, charLength) => {
                if (alive) callbacks.onBoundary?.({ charIndex, charLength })
              }
            : undefined,
      })
      const base: TTSSpeakHandle = {
        cancel: () => {
          // Marcar muerto ANTES de parar: cualquier callback en vuelo o
          // tardio (onStopped/onDone/onError del stop global) queda obsoleto.
          alive = false
          try {
            backend.stop()
          } catch {
            // parar nunca debe romper al orquestador.
          }
        },
      }
      if (canPause) {
        return {
          ...base,
          pause: () => {
            try {
              backend.pause?.()
            } catch {
              // best-effort
            }
          },
          resume: () => {
            try {
              backend.resume?.()
            } catch {
              // best-effort
            }
          },
        }
      }
      return base
    },
  }
}
