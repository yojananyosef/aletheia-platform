# Tasks: bootstrap-platform-app

Roadmap completo derivado de `docs/logos-feature-inventory.md` (inventario Logos → fases).
F0-F5 = ruta de envío inicial; F6-F14 = mapa completo por fases. Cada fase termina con
verificación verde antes de continuar.

## F0 — Monorepo + engine (sin UI)

- [x] Bun workspaces (apps/*, packages/*) + tsconfig project references + typecheck verde
- [x] `packages/core`: canon 66 libros (datos públicos), ReaderSettings, tokens de los 3 temas
- [x] `packages/core/tts`: interfaz Engine + TTSOrchestrator (cola por versículo, boundary,
      cancelación con referencia local) + tests
- [x] `packages/module-engine`: catalog.ts (fetch + cache de catalog.json)
- [x] `packages/module-engine`: installer.ts (download → sha256 expo-crypto → unzip → sandbox)
- [x] `packages/module-engine`: registry.ts (instalados, versiones, enable/disable)
- [x] `packages/module-engine`: reader bible (verses/headings/footnotes) con expo-sqlite
- [x] Verificación: instalar ASV.amod en sandbox de test y leer Génesis 1:1 (test E2E del engine)

## F1 — Shell Expo + datos reales

- [x] `apps/mobile`: Expo SDK 56 + Expo Router + NativeWind/Uniwind + tipos estrictos
- [x] Tokens de tema (pergamino/sepia/noche) + expo-font (OpenDyslexic/Atkinson/Literata)
- [x] Pantalla Biblioteca: catálogo con fichas (licencia/attribution visibles) + instalar
- [x] Pantalla Leer mínima: capítulo desde módulo instalado, navegación capítulos
- [x] Config plugin expo-sqlite `enableFTS` + verificación FTS5 en dispositivo
      (plugin configurado en app.json; `verifyFts5Support()` corre al abrir Biblioteca
      con chip "FTS5 verificado" — el SQL del probe vive en
      `module-engine/src/reader/fts-probe.ts` compartido y verificado headless con
      bun:sqlite (`test/fts-probe.test.ts` verde: Jesús≈JESUS + casos de fallo).
      VERIFICADO en emulador 2026-09-11: chip "FTS5 verificado ✓" con catálogo
      real. Hallazgo: expo-sqlite ~56 aborta (SIGABRT en sqlite3_close) al cerrar
      la base :memory: — el probe ya no cierra (una :memory: por sesión) y el
      resultado se cachea con un reintento anti-HMR. Nota: en Expo Go el sqlite
      empaquetado ya trae FTS5; re-verificar el chip en una dev build EAS antes
      de release.)
- [x] Verificación: instalar ASV desde el catálogo real en simulador y leer Génesis 1 completo
      (VERIFICADO en emulador Aletheia_Light 2026-09-11 con capturas: catálogo v1
      con 4 módulos → Instalar ASV 3.2MB → "Instalado v1.0.0" → Leer muestra
      Génesis 1 y 2 íntegros; la instalación persiste tras force-stop. Hallazgo:
      el `unzip` asíncrono de fflate usa Web Workers (inexistentes en Hermes) —
      el installer usa `unzipSync` desde entonces.)

## F2 — Lector paridad (§B inventario)

- [ ] Paginación por presupuesto de alto con onLayout (fixture comparativo ±2%)
      (pendiente: el lector actual usa ScrollView continuo; la paginación discreta
      con continuaciones sin repetir verse-super requiere medición en dispositivo)
- [x] verse-super, headings, notas al pie + Tooltip long-press temado (gemelo RN)
      (números superíndice + headings del engine; notas con tooltip custom en Modal,
      abre con tap y long-press, sin tooltips nativos; long-press de nota no
      dispara el VerseModal del versículo — VERIFICADO en emulador 2026-09-11:
      verse-super visible en Génesis 1-2; el ASV trae hasHeadings:false así que
      headings/tooltip de nota quedan verificados a nivel de engine + tests,
      pendientes de un módulo con esos features en dispositivo)
- [x] TOC (tabla de contenidos) + locator bar + navegación por libro/capítulo
      (picker con pestañas Libros/Capítulos, grid de capítulos, locator
      "Libro cap/total" tocable — VERIFICADO en emulador 2026-09-11: lista de
      libros con conteos, grid 5 columnas, salto a Génesis 2. Hallazgo: cambiar
      `numColumns` de un FlatList en caliente crashea (Invariant Violation) —
      cada pestaña usa su propio FlatList con `key` distinto.)
- [x] Temas/fuentes/tamaños/interlineado/espaciado conectados a settings
      (hoja "Aa": 3 temas, 4 fuentes, steppers con clamp del core, todo ≥44px —
      VERIFICADO en emulador 2026-09-11: cambio a tema Noche re-renderiza toda
      la app en oscuro)
- [x] Bionic reading + puntos silábicos + line focus TDAH (core compartido)
      (`packages/core/src/reading/text.ts` + 40 tests: silabeo ES determinista
      con diptongos/hiatus/h-muda/dígrafos, biónica por segmentos; line focus
      atenúa versículos no enfocados, el foco sigue al toque — VERIFICADO en
      emulador 2026-09-11: Génesis 2 con anclas en negrita tras activar el toggle)
- [x] Modo lectura simple (a11y AAA, "vista limitada" heredada de Logos)
      (mínimos 18pt/1.6, sin biónica/silábica ni marcadores de nota)
- [ ] Filtros del lector: notas on/off, números on/off, columnas 1/2/auto
      (notas y números conmutables desde la hoja "Aa" — toggles visibles y con
      estado en emulador; columnas 1/2/auto pendiente del layout de paginación
      — exponer el control hoy sería falso)
- [x] Marcadores + VerseModal (bottom sheet) + posición persistente
      (`reading-position.json` por módulo/libro/cap con reanudación al abrir —
      VERIFICADO en emulador 2026-09-11: tras navegar a Génesis 2, un
      force-stop + relanzar restaura "Genesis 2" directamente;
      `bookmarks.json` con toggle desde VerseModal por long-press + indicador ◆;
      5 tests del store)
- [ ] Verificación: 3 capítulos comparados contra legacy; audit de accesibilidad básica
      (pendiente dispositivo + acceso al legacy)

## F3 — TTS bimodal + background

- [x] ExpoSpeechEngine (rate/pitch/onBoundary/voices es-ES)
      (`apps/mobile/src/engine/speech-engine.ts`: adaptador testeable headless
      sobre backend inyectable + `expo-speech-backend.ts` para produccion;
      mapeo rate/pitch/lang/voice, boundary {charIndex,charLength} nativo y
      SpeechSynthesisEvent en web normalizados, onStopped-tras-stop silencioso,
      ids locales anti-callbacks-tardios. `pickVoiceId`/`findWordIndexAtOffset`
      en `core/tts/highlight.ts`. Voces: helper `resolveVoiceId()`; el
      contenido es ingles (lang 'en' por defecto), voces es disponibles bajo
      demanda. Misma engine en Android+iOS+web: expo-speech web ya delega en
      SpeechSynthesis; Piper WASM queda como fallback futuro documentado.)
- [x] Config plugin iOS UIBackgroundModes audio + useApplicationAudioSession false
      (`UIBackgroundModes: ["audio"]` en app.json + `useApplicationAudioSession:
      false` en iOS al narrar. PENDIENTE iPhone: verificar narracion con
      pantalla bloqueada en dispositivo real.)
- [ ] Lock screen controls (expo-audio setActiveForLockScreen) con metadata
      (PENDIENTE: expo-speech no expone MPNowPlayingInfoCenter; requiere modulo
      nativo o expo-audio con sesion compartida. Marcado "pendiente iPhone"
      como se acordo: codigo listo donde es posible, verificacion documentada.)
- [x] Resaltado bimodal conectado al lector + avance automático de versículo
      (barra TTS en Leer: play/pausa/stop + velocidad 0.85/1/1.25x; versiculo
      en curso con fondo accent-subtle + autoscroll; tocar otro versiculo
      mientras suena hace seek — VERIFICADO en emulador Android 2026-09-11:
      play → ⏸ + ■ + "Leyendo v.1" con Génesis 2:1 resaltado; pausa → ▶ +
      "Pausado". Sin audio audible: el emulador corre con -no-audio, la
      verificación es de estados/orquestador, no de sonido.)
- [x] Karaoke palabra-por-palabra (read-aloud de Logos, boundary por palabra)
      (`KaraokeText`: boundary -> palabra activa en negrita ×1.06. Sin boundary
      en la plataforma, degrada a resaltado por versiculo — verificado a nivel
      de estados en emulador Android junto al punto anterior.)
- [x] Test de carrera pausa-vs-generación (sin errores espurios)
      (`speech-engine.test.ts`: 5 tests — stale onDone/onError tras cancel,
      onStopped silencioso, handle sin pause en Android + integracion con el
      orquestador stop-mid-utterance; mas 5 tests de highlight en core.)
- [ ] Verificación en iOS real con pantalla bloqueada
      (pendiente dispositivo; Android+web se verifican en emulador Pista A.)

## F4 — Estudio v1 + Buscar + Inicio

- [x] Panel Estudio: comentario sincronizado por pasaje (módulo commentary instalado)
      (sigue a Leer via posicion persistente o deep-link ?osis=&chapter=&verse=;
      selector de comentario instalado —JFB por defecto— con atribucion visible;
      versiculo objetivo destacado + resto del capitulo tocable. VERIFICADO en
      emulador con ASV real 2026-09-11: Estudio abre en Gen 2:1 sincronizado
      desde Leer; sin JFB/SMITH instalados muestra los empty states correctos.)
- [x] Long-press palabra → lookup diccionario (FTS5 sobre entries de SMITH)
      (flujo: long-press versiculo → "Estudiar pasaje" → Estudio sincronizado +
      tarjeta Diccionario con lookup exacto/sortKey + fallback FTS + deep-link
      ?dict=. Lookup palabra-por-palabra in-reader queda como refinamiento
      futuro: envolver cada palabra penaliza el scroll en capitulos largos.
      Deep-link ?dict= verificado en diseño; con JFB/SMITH reales pendiente de
      instalar esos módulos en el emulador.)
- [x] Pestaña Buscar: FTS5 global biblia+libros, resultados agrupados por versículo/capítulo
      (`searchInstalledModules`: Biblias/Comentarios/Diccionarios agrupados con
      nombre de modulo; tap → Leer (guarda posicion + ?verse=) o Estudio;
      MATCH invalida o modulo danado se reporta en `errors` sin romper.
      VERIFICADO en emulador con ASV real 2026-09-11: "god" → BIBLIAS (15)
      con Génesis 1:1-1:6; "jehovah" → BIBLIAS (15) con Génesis 2:4-2:9.)
- [x] Inicio v1: continuar leyendo + devocional del día (SME) + versículo del día (rotación PD) + progreso
      (Continuar usa la posicion persistente ya verificada; SME del dia via
      DevotionReader —requiere SME 1.0.1 del catalogo, antes corrupto—;
      versiculo del dia: rotacion de 14 refs PD con texto desde la Biblia
      instalada; progreso: modulos + marcadores. VERIFICADO en emulador
      2026-09-11: "ASV · Genesis 2" + Continuar, Psalms 23:1 con texto real,
      "1 módulo · 0 marcadores", empty state SME correcto sin SME instalado.)
- [x] Web export: WebSpeechEngine + Piper WASM fallback (paridad con legacy)
      (expo-speech web ya delega en SpeechSynthesis con boundary DOM: la misma
      SpeechEngine cubre Android+iOS+web sin codigo extra. Piper WASM queda
      como fallback futuro documentado —sin motor offline hoy—.)
- [x] Verificación: flujo Inicio→Leer→Estudio→Buscar completo con módulos reales
      (VERIFICADO en emulador 2026-09-11 con ASV: Inicio→Continuar→Génesis 2,
      Estudio sincronizado en Gen 2:1, Buscar "jehovah" → 15 resultados.
      Hallazgo: tras varios Fast Refresh seguidos el puente nativo de
      expo-sqlite en Expo Go se cuelga (todo `prepareAsync` → NPE,
      chip "FTS5 no soportado", Leer vacío) y SOLO lo arregla un force-stop +
      relanzar — no era bug de queries (la query original funciona en sesión
      fresca). Mitigaciones aplicadas: `ExpoSqliteAdapter` cachea una conexión
      por ruta y sesión JS (menos conexiones huerfanas ante el close() no-op),
      y `searchInstalledModules` reporta `errors` por módulo para no mostrar
      nunca más un 0 mudo.)

## F5 — Distribución

- [ ] EAS Build preview/production + signing
- [ ] EAS Submit (Play Console + App Store Connect) con listings ES
- [ ] EAS Update canales + primer OTA
- [ ] Export web funcionando con Piper WASM + ayuda local embebida
- [ ] Auditoría: tamaño de app, arranque frío, accesibilidad, offline

## F6 — Workspace de paneles (firma de Logos)

- [ ] Panel manager: tiles + pestañas + dock/duplicar/reabrir (web/tablet landscape)
- [ ] Link sets A–F (paneles sincronizados por referencia)
- [ ] Entornos: layouts guardables + 12 de inicio rápido (biblia+comentario, devocional,
      estudio griego/hebreo, pasaje, tema, búsqueda…)
- [ ] Command Box (Go Box): pasaje/tema/módulo + autocompletado con comandos
- [ ] Acciones rápidas + atajos (pins) + historial por panel + favoritos con quick links
- [ ] Wizard de bienvenida (estudio personal / grupo deferred)
- [ ] Verificación: entorno "Biblia+Comentario" sincronizado funcionando en web export

## F7 — Notas y resaltados completos

- [ ] Notas ancladas (módulo, libro, cap., versículo, rango) + múltiples anclajes
- [ ] Cuadernos + etiquetas + iconos/colores + papelera con restaurar
- [ ] Estilos de resaltado: colores sólidos + marcadores temáticos propios (nuestro diseño)
- [ ] Indicadores en el lector + filtro de notas + enfatizar (resultados, resaltados propios)
- [ ] Orden por creación/modificación/cuaderno/referencia + vista compacta
- [ ] Verificación: flujo nota→ancla→cuaderno→búsqueda→restaurar completo

## F8 — Documentos personales + copiar/compartir

- [ ] Listas de pasajes (títulos, orden, drag&drop web) + envío desde lector (send-to)
- [ ] Lista de oración (estados: programada/contesta) + Inicio card
- [ ] Recortes (clippings) + send-to
- [ ] Copiar versículos con formatos (simple, 1v/línea, formateado) + estilos de cita
- [ ] Bibliografía con citas e hyperlink
- [ ] Export/import de documentos como archivo portable (JSON firmado) — paridad "compartir"
- [ ] Inline search en recurso abierto + colecciones de búsqueda + match settings
- [ ] Verificación: ciclo documento crear→exportar→importar en segundo dispositivo

## F9 — Planes de lectura completos

- [ ] Generador de planes (recurso + cadencia: diario/fechas específicas/sesiones + metas)
- [ ] Progreso (sesiones, % completa, racha, atraso) + catch-up (ponerme al día)
- [ ] Recordatorio en el lector (cinta del plan) + notificación móvil opt-in
- [ ] Inicio: tarjetas de planes activos + "leer juntos" como plantilla importable (sin backend)
- [ ] Verificación: plan de 30 días creado, seguido 3 días, catch-up probado

## F10 — Guías y workflows (requiere catálogo v1.1: TSK, Nave, Easton)

- [ ] Guía de pasajes: comentarios + referencias cruzadas + diccionarios del pasaje
- [ ] Workflows: plantillas personalizables (documento) + progreso por pasos + export
- [ ] Estudio bíblico builder v1 (bloques + preguntas extraídas de módulos instalados)
- [ ] Verificación: guía de pasajes sobre Jn 3 con 3 módulos instalados

## F11 — Enciclopedia bíblica (Factbook) + entidades

- [ ] Índice de entidades desde módulos (Nave como backbone; personas/lugares/cosas/eventos)
- [ ] Factbook: ficha por entidad (diccionarios + pasajes clave + xrefs + comentarios que la mencionan)
- [ ] Pasajes paralelos (módulo armonía PD) + insights (uso AT→NT desde TSK)
- [ ] Etiquetas de entidad sobre el texto del lector (clicable → Factbook)
- [ ] Timeline básico por entidad (eventos de Nave)
- [ ] Verificación: ficha de "David" con ≥3 fuentes agregadas

## F12 — Idiomas originales (catálogo v1.1: WLC, SBLGNT, WHNU, Strong, Abbott-Smith, Robinson)

- [ ] Interlineal por lema (verso de traducción ↔ verso original con strongs)
- [ ] Word study: lema → Strong → entrada de léxico → ejemplos de uso en el texto
- [ ] Listas de palabras + búsqueda morfológica básica (lema/morfología desde columnas strongs)
- [ ] Búsqueda por keywords (strongs:, lema:) en DSL
- [ ] Verificación: estudio de λέγω (G3004) con usos y definición

## F13 — Búsqueda semántica local (sin cloud)

- [ ] Embeddings locales de módulos (sqlite-vec) indexados por versículo/entry
- [ ] Búsqueda inteligente: pregunta natural → pasajes (con citas reales)
- [ ] Resumen extractivo local + sinopsis de resultados (sin IA cloud, disclaimer propio)
- [ ] Gráficos de resultados (barras por libro/capítulo)
- [ ] Verificación: "¿Qué dice la Biblia sobre la oración?" devuelve pasajes citables

## F14 — Comparación de texto + presentador

- [ ] Comparación de Biblias lado a lado (diff porcentual, interlineal cuando aplique)
- [ ] Presentador simple (diapositivas de pasaje, modo pantalla completa — análogo Proclaim-lite)
- [ ] Sermón builder v2: plantillas + export HTML/Markdown (roadmap según demanda)
- [ ] Roadmap futuro documentado: atlas/mapas (AMF v2 media), sentidos (Louw-Nida PD),
      sync self-hosted, multi-idioma de UI

## Coordinación con aletheia-catalog (lote v1.1 — habilita F10-F12)

- [ ] TSK (comentario de xrefs, zCom — resolver versificación extendida)
- [ ] Nave (topical/entities backbone), Easton, ISBE, Hitchcock (rawld4)
- [ ] StrongsGreek, StrongsHebrew, Abbott-Smith (lexicon), Robinson (morphology)
- [ ] WLC, SBLGNT, WHNU (biblias originales, zText4 — verificar versificación y strongs)
- [ ] Módulo armonía de pasajes paralelos (fuente PD a definir)
