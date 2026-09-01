# alethia-platform

Plataforma de estudio bíblico **gratuita y abierta** — el "Logos libre": una sola app
universal (iOS / Android / web) construida con Expo, alimentada por el catálogo oficial
de módulos [.amod](https://github.com/yojananyosef/alethia-catalog).

## Producto

- **Inicio** — dashboard: continuar leyendo, devocional del día, plan de lectura
- **Biblioteca** — catálogo oficial: fichas con licencia visible, instalación on-demand
- **Leer** — lector paginado e-ink heredado de alethia-reader (temas, fuentes accesibles,
  lecturas biónica/silábica, line focus TDAH, WCAG 2.2 AAA)
- **Estudio** — paneles enlazados: comentario sincronizado por pasaje, diccionarios,
  búsqueda full-text con FTS5 sin diacríticos
- **TTS bimodal** — expo-speech nativo con background audio en iOS + lock screen controls

## Arquitectura

```
packages/core/           # dominio compartido: canon, settings, TTS orchestrator
packages/module-engine/  # AMF v1: catálogo → instalación (sha256) → SQLite/FTS5 en sandbox
apps/mobile/             # Expo SDK 56 universal (iOS / Android / web export)
```

Estrategia paralela: el ecosistema existente (alethia-reader en Vercel, alethia-bridge,
alethia-modules, alethia-gateway) queda intacto como referencia; este repo aprende de él
pero no reutiliza su código.

## Flujo spec-driven

Toda implementación vive en `openspec/changes/bootstrap-platform-app/` con
proposal → specs → design → tasks (fases F0-F5). Sin proposal aprobada, sin código.
