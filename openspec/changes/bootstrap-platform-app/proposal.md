# Proposal: bootstrap-platform-app — Plataforma bíblica universal (Logos libre)

## Why

El ecosistema Aletheia está fragmentado: reader (Next.js PWA), bridge (exégesis modular),
gateway (22 traducciones), modules (catálogo .abmod), timeline, teolingo — apps separadas
con el mismo ADN de accesibilidad. Logos demuestra el producto objetivo (6M usuarios,
biblioteca + herramientas enlazadas + multiplataforma) pero es comercial y cerrado.

La estrategia acordada: **una plataforma desde cero** en repo paralelo, alimentada por un
catálogo oficial de módulos legales ([aletheia-catalog](https://github.com/yojananyosef/aletheia-catalog)),
con la estructura de UX de Logos y el confort accesible del legacy. Nada del ecosistema
existente se modifica ni se reutiliza como código: solo como conocimiento.

## What

- **Monorepo Bun** con `packages/core` (canon, settings, orquestador TTS),
  `packages/module-engine` (consumidor de .amod: catálogo → descarga → sha256 →
  SQLite/FTS5 en sandbox) y `apps/mobile` (Expo SDK 56 universal).
- **Module-first**: las Biblias se leen desde módulos .amod del catálogo (no hay capa
  JSON propia). ASV, KJV, SME y Smith disponibles en v1 del catálogo.
- **UX Logos-structured + confort heredado**: bottom tabs Inicio/Biblioteca/Leer/Estudio/
  Buscar; temas pergamino/sepia/noche; fuentes accesibles; targets 44px; licencia de cada
  módulo visible en su ficha.
- **TTS multi-motor** con background audio iOS (expo-speech + lock screen controls) y
  Piper offline premium (sherpa-onnx) — diseño absorbido de la investigación de
  aletheia-universal (repo en pausa).
- **Distribución**: EAS Build/Submit (tiendas) + EAS Update (OTA) + export web.

### Alcance completo por fases (F0–F14)

El mapa de fases cubre TODO el inventario de funcionalidades de Logos extraído de
app.logos.com (`docs/logos-feature-inventory.md`), mapeado a equivalentes gratuitos y
abiertos, organizado para que nada quede afuera aunque el proyecto avance por fases:

- F0-F5: base productiva (leer + escuchar + guardar + buscar básico + tiendas).
- F6: workspace de paneles (tiles, tabs, link sets, entornos, command box) — la firma de Logos.
- F7: notas y resaltados completos (cuadernos, anclajes, estilos).
- F8: documentos personales (listas de pasajes/oración, recortes, copiar versículos,
  bibliografía, export/import portable) + búsqueda avanzada (inline, colecciones, DSL).
- F9: planes de lectura completos (generador, progreso, racha, catch-up).
- F10: guías y workflows (requiere lote v1.1 del catálogo: TSK, Nave, Easton).
- F11: Enciclopedia bíblica (factbook de entidades + pasajes paralelos + insights + timeline).
- F12: idiomas originales (interlineal, word study, morfología — catálogo v1.1).
- F13: búsqueda semántica local (embeddings sqlite-vec, resumen extractivo — reemplaza
  todas las features "IA de Logos" sin cloud ni créditos).
- F14: comparación de texto + presentador simple; roadmap documentado (mapas, sentidos,
  sync self-hosted, multi-idioma).

## Non-Goals

- No reutilizar código de aletheia-reader/bridge/modules/gateway (solo aprendizaje).
- No catálogos de terceros ni importación de usuario en v1.
- No escritorio nativo (Expo Desktop/Tauri) en este change — continuación documentada.
- No features de Logos pagas (pre-pub, marketplace con royalties, AI cloud) — análogos
  gratuitos o roadmap.

## Impact

- Repo nuevo; ecosistema existente intacto y operativo (web legacy en Vercel).
- Catálogo: única fuente de contenido; el engine valida sha256 y muestra licencias.
- Specs nuevas: `modules`, `reader`, `tts`, `distribution`.
- Riesgos: paridad de paginación RN vs DOM (fixture comparativo), tamaños de descarga
  de módulos (~3.5MB c/u, aceptable), dependencia de red para primera instalación
  (mitigado: módulos cacheados en sandbox).
