/**
 * Contrato de motor TTS. Los motores (expo-speech movil, Web Speech + Piper WASM web,
 * sherpa-onnx premium) implementan esta interfaz; el TTSOrchestrator los consume sin
 * conocer la plataforma.
 */
export interface TTSBoundary {
  /** offset en caracteres dentro del texto en curso */
  charIndex: number
  charLength?: number | undefined
}

export interface TTSSpeakOptions {
  rate?: number | undefined
  pitch?: number | undefined
  lang?: string | undefined
  voiceId?: string | undefined
}

export interface TTSEngineCallbacks {
  onBoundary?(boundary: TTSBoundary): void
  onEnd?(): void
  onError?(error: Error): void
}

export interface TTSSpeakHandle {
  pause?(): void
  resume?(): void
  /** Cancelacion con referencia local: el engine NO debe emitir callbacks utiles
   * despues de cancel(); cualquier onEnd/onError tardio se considera espurio. */
  cancel(): void
}

export interface TTSEngine {
  readonly id: string
  speak(text: string, options: TTSSpeakOptions, callbacks: TTSEngineCallbacks): TTSSpeakHandle
}
