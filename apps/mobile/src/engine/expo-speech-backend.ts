import { Platform } from 'react-native'
import * as Speech from 'expo-speech'

import { pickVoiceId } from '@aletheia/core'

import { createSpeechEngine, type SpeechBackend } from './speech-engine'

/**
 * Adaptador de produccion: `expo-speech` (Android + web via SpeechSynthesis;
 * iOS conservado pero archivado) como backend del SpeechEngine testeable (F3).
 *
 * - Foco Android+Web (2026-09-11): Android sin pause()/resume() — el orquestador
 *   aplica su fallback (cancelar + re-narrar al reanudar). Web delega en
 *   window.speechSynthesis (boundary DOM con charIndex/charLength); Piper WASM
 *   queda como fallback futuro documentado.
 * - iOS archivado: `useApplicationAudioSession: false` + UIBackgroundModes audio
 *   en app.json se conservan, pero lock-screen metadata (MPNowPlayingInfoCenter)
 *   y verificacion en iPhone real quedan en Deferred-iOS (ver tasks.md).
 */
const expoBackend: SpeechBackend = {
  speak(text, options) {
    Speech.speak(text, {
      rate: options.rate,
      pitch: options.pitch,
      language: options.language,
      voice: options.voice,
      useApplicationAudioSession: options.useApplicationAudioSession,
      onDone: options.onDone,
      onStopped: options.onStopped,
      onError: options.onError,
      // Nativo emite {charIndex, charLength}; web emite SpeechSynthesisEvent
      // (tambien con charIndex/charLength). Se normaliza a (indice, longitud).
      onBoundary:
        options.onBoundary !== undefined
          ? (ev: { charIndex: number; charLength: number }) =>
              options.onBoundary?.(ev.charIndex, ev.charLength)
          : null,
    })
  },
  stop() {
    void Speech.stop()
  },
  pause() {
    void Speech.pause()
  },
  resume() {
    void Speech.resume()
  },
  async getVoices() {
    const voices = await Speech.getAvailableVoicesAsync()
    return voices.map((v) => ({ identifier: v.identifier, language: v.language }))
  },
}

/** Engine compartido por sesion (el singleton expo-speech es global). */
export const speechEngine = createSpeechEngine(expoBackend, {
  platformSupportsPause: Platform.OS !== 'android',
  lang: 'en',
  useApplicationAudioSession: Platform.OS === 'ios' ? false : undefined,
})

/** Resuelve una voz para `lang` (p. ej. "es-ES") entre las instaladas. */
export async function resolveVoiceId(preferredLanguages: readonly string[]): Promise<string | undefined> {
  try {
    const voices = await expoBackend.getVoices?.() ?? []
    return pickVoiceId(voices, preferredLanguages)
  } catch {
    return undefined
  }
}
