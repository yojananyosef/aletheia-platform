# Investigación absorbida

Este repo absorbe la investigación móvil de 2026 realizada para el proyecto (antes en
alethia-universal, ahora en pausa como PoC):

- Selección de stack: Expo SDK 56 universal sobre Tauri 2 (móvil inmaduro) y Capacitor
  (sin calidad nativa) y Flutter (reescritura Dart).
- TTS: expo-speech + UIBackgroundModes + useApplicationAudioSession:false (PR expo #37487)
  + lock screen controls via expo-audio; Piper offline via sherpa-onnx.
- Modelo de negocio Logos: ver `alethia-catalog/docs/research-logos-2026.md`.
