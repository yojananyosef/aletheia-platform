/**
 * Utilidades puras para el resaltado bimodal/karaoke del TTS (F3).
 *
 * El engine (expo-speech nativo, SpeechSynthesis web) emite boundary events
 * con `charIndex`/`charLength` sobre el texto del versiculo en curso. Estas
 * funciones traducen offsets a palabras para que el lector resalte la palabra
 * exacta sin conocer la plataforma.
 */

export interface WordSpan {
  word: string
  start: number
  length: number
}

/** Divide el texto en palabras (separadas por espacios en blanco) con offsets. */
export function splitWords(text: string): WordSpan[] {
  const out: WordSpan[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[0], start: m.index, length: m[0].length })
  }
  return out
}

/**
 * Indice de la palabra que contiene `charIndex` (charIndex dentro de una
 * palabra o justo en su inicio). -1 si el offset esta fuera del texto o cae
 * en un hueco de espacios (se resuelve a la palabra anterior si existe).
 */
export function findWordIndexAtOffset(text: string, charIndex: number): number {
  if (!Number.isFinite(charIndex) || charIndex < 0 || charIndex >= text.length) return -1
  const words = splitWords(text)
  for (const [i, w] of words.entries()) {
    if (charIndex >= w.start && charIndex < w.start + w.length) return i
  }
  // Hueco de espacios: la palabra en curso es la ultima que ya empezo.
  let prev = -1
  for (const [i, w] of words.entries()) {
    if (w.start < charIndex) prev = i
    else break
  }
  return prev
}

export interface VoiceChoice {
  identifier: string
  language: string
  name?: string | undefined
}

/**
 * Elige voz por preferencia de idiomas: primera coincidencia exacta
 * (case-insensitive, p. ej. "es-ES"), luego por prefijo ("es"), luego nada.
 * No impone defecto: sin coincidencia el engine usa su voz por defecto.
 */
export function pickVoiceId(
  voices: readonly VoiceChoice[],
  preferredLanguages: readonly string[],
): string | undefined {
  const norm = (s: string): string => s.toLowerCase().replace('_', '-')
  for (const pref of preferredLanguages) {
    const p = norm(pref)
    const exact = voices.find((v) => norm(v.language) === p)
    if (exact) return exact.identifier
  }
  for (const pref of preferredLanguages) {
    const p = norm(pref)
    const base = p.split('-')[0]
    const partial = voices.find((v) => norm(v.language).split('-')[0] === base)
    if (partial) return partial.identifier
  }
  return undefined
}
