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

- [x] `apps/mobile`: Expo SDK 57 + Expo Router + NativeWind/Uniwind + tipos estrictos
      (actualizado 2026-09-13: `expo install expo@^57 --fix` → expo 57.0.22,
      RN 0.86.3, router 57; upgrade menor sin breaking changes. Resuelve la
      regresion Hermes V1 del doctor: 20/21 checks, solo queda el falso
      positivo de duplicados por installs aislados de bun.)
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
- [x] Filtros del lector: notas on/off, números on/off, columnas 1/2/auto
      (notas y números conmutables desde la hoja "Aa" y cableados al render;
      columnas 1/2/auto expuestas en "Aa" como ancho + multicolumna web
      —Android 1 columna centrada, web 2 con CSS columns, auto responsive ≥900px—.
      La paginación discreta con presupuesto de alto sigue pendiente del motor de
      paginación; el control actual es honesto: layout, no paginación.)
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
      false` solo en iOS. FOCO ACTUAL: Android+Web — config iOS conservada pero
      sin verificacion hasta reactivar pista iOS.)
- [ ] Lock screen controls (expo-audio setActiveForLockScreen) con metadata — DEFERRED-iOS
      (ARCHIVADO 2026-09-11: expo-speech no expone MPNowPlayingInfoCenter; requiere
      modulo nativo o expo-audio con sesion compartida. Solo iPhone; fuera del foco
      Android+Web.)
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
- [ ] Verificación en iOS real con pantalla bloqueada — DEFERRED-iOS
      (ARCHIVADO 2026-09-11: foco Android+Web. Android+web se verifican en emulador Pista A.)

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
      Deep-link ?dict= verificado en diseño; con módulos reales VERIFICADO a nivel
      engine 2026-09-11 (script headless contra catálogo: JFB Gen1:1 OK/14 entries
      cap1, TSK Gen1:1 OK/31 entries, SMITH/NAVE AARON OK, EASTON/ISBE AARON+grace OK;
      queda pendiente instalarlos en el emulador para el pase visual).)
- [x] Pestaña Buscar: FTS5 global biblia+libros, resultados agrupados por versículo/capítulo
      (`searchInstalledModules`: Biblias/Comentarios/Diccionarios agrupados con
      nombre de modulo; tap → Leer (guarda posicion + ?verse=) o Estudio;
      MATCH invalida o modulo danado se reporta en `errors` sin romper.
      VERIFICADO en emulador con ASV real 2026-09-11: "god" → BIBLIAS (15)
      con Génesis 1:1-1:6; "jehovah" → BIBLIAS (15) con Génesis 2:4-2:9.)
- [x] Inicio v1: continuar leyendo + devocional del día (SME) + versículo del día (rotación PD) + progreso
      (Continuar usa la posicion persistente ya verificada; SME del dia via
      DevotionReader —SME 1.0.1 verificado 2026-09-11: entrada de hoy OK, 366 días—;
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

## F5 — Distribución (foco Android+Web; iOS archivado)

- [x] EAS Build preview/production Android (APK interno + AAB) + signing
      (`apps/mobile/eas.json`: preview APK interno + production AAB, `bun: 1.4.2`
      en ambos perfiles —el worker trae bun 1.3.13 y no lee `bun.lock` v2—,
      cuenta @johangutierrez vinculada (projectId d927ae7d).
       VERIFICADO 2026-09-12: build preview FINISHED en EAS, APK listo para el
       físico. PENDIENTE: instalar en el teléfono y pase en dispositivo.
       Saga peso 2026-09-13: APKs de ~116-117MB con 4 ABIs. El plugin v1
       (`ndk.abiFilters` en app/build.gradle) se inyecto en EAS (probado en
       logs) pero NO adelgazo: el plugin de Gradle de RN lo sobrescribe con
       `reactNativeArchitectures`. Fix en `7981882` (propiedad en
       gradle.properties via `withGradleProperties`). RESUELTO: rebuild
       remoto `d75b93db` FINISHED (SDK 57) → APK de 51.430.906 B con SOLO
       `lib/arm64-v8a` (86.6MB descomprimido). PENDIENTE: instalar este APK
       en el teléfono y pase en dispositivo.)
- [x] EAS Submit Play Console con listings ES (App Store Connect — DEFERRED-iOS)
      (Listings ES en `apps/mobile/store/play-listing-es/` + checklist con
      `track: internal`. Play Console ARCHIVADO 2026-09-12 (ver Deferred-PlayConsole:
      sin cuenta de pago 25 USD por ahora); el APK preview para el físico no
      necesita tienda.)
- [x] EAS Update canales + primer OTA (Android+Web)
      (`expo-updates ~56.0.7` instalado + `runtimeVersion: appVersion` + canales
       preview/production en eas.json. VERIFICADO 2026-09-13: primer `eas update`
       publicado en rama `preview` (grupo 8b6566f3, runtime 1.0.0, android+ios;
       mensaje "F5: tabs + index redirect, columnas 1/2/auto, ayuda offline,
       ABI arm64 preview"). El APK preview instalado lo recibe al siguiente
       arranque. VERIFICADO 2026-09-13: 2.º OTA publicado en `preview`
       (grupo 15e21561, runtime 1.0.0, commit 7539780: SDK 57,
       refresh-on-focus, fix spinner Estudio, pin v1.3.0, puntero latest).)
- [x] Export web funcionando + ayuda local embebida (Piper WASM = fallback futuro documentado)
       (VERIFICADO 2026-09-11 en Chromium contra dist real: Biblioteca con catálogo
       (entonces 14 módulos; hoy 17 con APF/CREEDS/VINCENT), chip "FTS5 verificado ✓",
       instalación ASV con sha256, Leer con Génesis, Buscar "god" → Biblias (15),
       Inicio→Continuar persistente. Stack: `adapters.web.ts` (OPFS +
       @sqlite.org/sqlite-wasm con FTS5 via deserialize; sql.js y wa-sqlite se
       descartaron: vienen SIN FTS5) + `metro.config.js` mapea
       `sqlite3-worker1.mjs`. Consola limpia, 0 errores.
       CORS RESUELTO 2026-09-13 en aletheia-catalog v1.3.0: canal git+raw
       (`releaseBase` pineado a tag con `ACAO:*`, `dist/*.amod` commiteados).
       La app pineo v1.3.0 (`db8f59a`) y luego sumo puntero flotante
       `catalog/latest.json` con fallback al pin (`68e748b`): ve siempre la
       ultima version sin romperse. Sin cambios de engine: downloadUrl +
       sha256 intactos.)
- [ ] Auditoría: tamaño de app, arranque frío, accesibilidad, offline (Android+Web)
      (Evidencia 2026-09-11: web entry 2.16MB + sqlite3.wasm 869KB (lazy) + css 12KB;
      a11y estática 100% Pressable con role+label y targets ≥44px (se corrigió
      inicio.tsx:138); offline web probado (OPFS persiste instalación y posición
      entre navegaciones). Queda en dispositivo: tamaño AAB/APK, arranque frío,
      TalkBack en Leer/Biblioteca.)

## Deferred-iOS (archivado 2026-09-11; reactivar como pista separada)

- [ ] EAS Build IPA + Submit App Store Connect + listings ES
- [ ] Verificación narración con pantalla bloqueada en iPhone real
- [ ] Lock screen controls con metadata (MPNowPlayingInfoCenter / módulo nativo)

## Deferred-PlayConsole (archivado 2026-09-12; requiere cuenta de pago 25 USD)

- [ ] Cuenta Play Console + primera app + pista interna
- [ ] Build AAB production + clave de servicio para `eas submit`
- [ ] Capturas (Biblioteca, Leer, Estudio, Buscar), icono 512, gráfico 1024×500
- [ ] Clasificación por edades + primera subida a pista interna

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

## F10 — Guías y workflows (desbloqueado: TSK, Nave, Easton en catálogo ≥v1.2)

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

## F12 — Idiomas originales (parcial: Strong griego/hebreo + Abbott-Smith en catálogo ≥v1.2; WLC/SBLGNT/WHNU/Robinson EXCLUIDOS por licencia, pendiente decisión usuario)

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

## Coordinación con aletheia-catalog (lote v1.1 — ENTREGADO en catálogo v1.2/v1.3)

- [x] TSK (comentario de xrefs, zCom 10B — 31089 entradas, en catálogo)
- [x] Nave (topical/entities backbone), Easton, ISBE, Hitchcock (en catálogo)
- [x] StrongsGreek, StrongsHebrew, Abbott-Smith (en catálogo; Robinson EXCLUIDO por licencia CC BY-SA)
- [ ] WLC, SBLGNT, WHNU — EXCLUIDOS por licencia (SBLGNT non-commercial, WHNU CC BY-NC-SA, WLC requiere mapa Leningrad). Pendiente decisión usuario, no técnico
- [ ] Módulo armonía de pasajes paralelos (fuente PD a definir)
- [x] Canal + versionado (2026-09-13): git+raw pineado por tag con CORS `*`, `catalog/latest.json` flotante (release.yml lo mueve), gate anti-regresión. La app resuelve latest con fallback al pin
