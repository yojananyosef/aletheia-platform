# Tasks: bootstrap-platform-app

## F0 — Monorepo + engine (sin UI)

- [ ] Bun workspaces (apps/*, packages/*) + tsconfig project references + typecheck verde
- [ ] `packages/core`: canon 66 libros (datos públicos), ReaderSettings, tokens de los 3 temas
- [ ] `packages/core/tts`: interfaz Engine + TTSOrchestrator (cola por versículo, boundary,
      cancelación con referencia local) + tests
- [ ] `packages/module-engine`: catalog.ts (fetch + cache de catalog.json)
- [ ] `packages/module-engine`: installer.ts (download → sha256 expo-crypto → unzip → sandbox)
- [ ] `packages/module-engine`: registry.ts (instalados, versiones, enable/disable)
- [ ] `packages/module-engine`: reader bible (verses/headings/footnotes) con expo-sqlite
- [ ] Verificación: instalar ASV.amod en sandbox de test y leer Génesis 1:1 (test E2E del engine)

## F1 — Shell Expo + datos reales

- [ ] `apps/mobile`: Expo SDK 56 + Expo Router + NativeWind/Uniwind + tipos estrictos
- [ ] Tokens de tema (pergamino/sepia/noche) + expo-font (OpenDyslexic/Atkinson/Literata)
- [ ] Pantalla Biblioteca: catálogo con fichas (licencia/attribution visibles) + instalar
- [ ] Pantalla Leer mínima: capítulo desde módulo instalado, navegación capítulos
- [ ] Config plugin expo-sqlite `enableFTS` + verificación FTS5 en dispositivo
- [ ] Verificación: instalar ASV desde el catálogo real en simulador y leer Génesis 1 completo

## F2 — Lector paridad

- [ ] Paginación por presupuesto de alto con onLayout (fixture comparativo ±2%)
- [ ] verse-super, headings, notas al pie + Tooltip long-press temado (gemelo RN)
- [ ] Temas/fuentes/tamaños/interlineado/espaciado conectados a settings
- [ ] Bionic reading + puntos silábicos + line focus TDAH (core compartido)
- [ ] Marcadores + VerseModal (bottom sheet) + posición persistente
- [ ] Verificación: 3 capítulos comparados contra legacy; audit de accesibilidad básica

## F3 — TTS bimodal + background

- [ ] ExpoSpeechEngine (rate/pitch/onBoundary/voices es-ES)
- [ ] Config plugin iOS UIBackgroundModes audio + useApplicationAudioSession false
- [ ] Lock screen controls (expo-audio setActiveForLockScreen) con metadata
- [ ] Resaltado bimodal conectado al lector + avance automático de versículo
- [ ] Test de carrera pausa-vs-generación (sin errores espurios)
- [ ] Verificación en iOS real con pantalla bloqueada

## F4 — Estudio + búsqueda + inicio

- [ ] Panel Estudio: comentario sincronizado por pasaje (módulo commentary instalado)
- [ ] Long-press palabra → lookup diccionario (FTS5 sobre entries)
- [ ] Pestaña Buscar: FTS5 global por módulo con resultados por pasaje
- [ ] Inicio: continuar leyendo + devocional del día (SME) + progreso
- [ ] Web export: WebSpeechEngine + Piper WASM fallback (paridad con legacy)
- [ ] Verificación: flujo Estudio completo con JFB/Vincent cuando el catálogo los publique (v1.1)

## F5 — Distribución

- [ ] EAS Build preview/production + signing
- [ ] EAS Submit (Play Console + App Store Connect) con listings ES
- [ ] EAS Update canales + primer OTA
- [ ] Export web funcionando con Piper WASM
- [ ] Auditoría: tamaño de app, arranque frío, accesibilidad, offline
- [ ] Decisión de convergencia con el usuario (web en Vercel)
