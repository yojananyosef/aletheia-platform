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
- [ ] Config plugin expo-sqlite `enableFTS` + verificación FTS5 en dispositivo
      (plugin configurado en app.json; `verifyFts5Support()` corre al abrir Biblioteca
      con chip "FTS5 verificado" — pendiente confirmar en dispositivo real)
- [ ] Verificación: instalar ASV desde el catálogo real en simulador y leer Génesis 1 completo
      (engine cubierto por E2E F0 verde: catálogo real → ASV → Génesis 1; pendiente flujo
      completo en simulador — `bunx expo start` no disponible en este entorno)

## F2 — Lector paridad (§B inventario)

- [ ] Paginación por presupuesto de alto con onLayout (fixture comparativo ±2%)
- [ ] verse-super, headings, notas al pie + Tooltip long-press temado (gemelo RN)
- [ ] TOC (tabla de contenidos) + locator bar + navegación por libro/capítulo
- [ ] Temas/fuentes/tamaños/interlineado/espaciado conectados a settings
- [ ] Bionic reading + puntos silábicos + line focus TDAH (core compartido)
- [ ] Modo lectura simple (a11y AAA, "vista limitada" heredada de Logos)
- [ ] Filtros del lector: notas on/off, números on/off, columnas 1/2/auto
- [ ] Marcadores + VerseModal (bottom sheet) + posición persistente
- [ ] Verificación: 3 capítulos comparados contra legacy; audit de accesibilidad básica

## F3 — TTS bimodal + background

- [ ] ExpoSpeechEngine (rate/pitch/onBoundary/voices es-ES)
- [ ] Config plugin iOS UIBackgroundModes audio + useApplicationAudioSession false
- [ ] Lock screen controls (expo-audio setActiveForLockScreen) con metadata
- [ ] Resaltado bimodal conectado al lector + avance automático de versículo
- [ ] Karaoke palabra-por-palabra (read-aloud de Logos, boundary por palabra)
- [ ] Test de carrera pausa-vs-generación (sin errores espurios)
- [ ] Verificación en iOS real con pantalla bloqueada

## F4 — Estudio v1 + Buscar + Inicio

- [ ] Panel Estudio: comentario sincronizado por pasaje (módulo commentary instalado)
- [ ] Long-press palabra → lookup diccionario (FTS5 sobre entries de SMITH)
- [ ] Pestaña Buscar: FTS5 global biblia+libros, resultados agrupados por versículo/capítulo
- [ ] Inicio v1: continuar leyendo + devocional del día (SME) + versículo del día (rotación PD) + progreso
- [ ] Web export: WebSpeechEngine + Piper WASM fallback (paridad con legacy)
- [ ] Verificación: flujo Inicio→Leer→Estudio→Buscar completo con módulos reales

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
