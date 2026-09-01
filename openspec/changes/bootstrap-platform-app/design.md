# Design: bootstrap-platform-app

## 1. Monorepo y frontera de paquetes

```
alethia-platform/
├── packages/core/           # TS puro, cero dependencias de React/RN
│   ├── canon/               # tabla 66 libros + rangos (reimplementada desde hechos públicos)
│   ├── settings/            # ReaderSettings, temas, fuentes, flags neurocognitivos
│   └── tts/                 # TTSOrchestrator + interfaz Engine + contrato de adaptadores
├── packages/module-engine/  # consumidor AMF v1 (expo-sqlite + expo-file-system + expo-crypto)
│   ├── catalog.ts           # fetch catalog.json + cache + refresh
│   ├── installer.ts         # download → sha256 (expo-crypto) → unzip → sandbox modules/
│   ├── registry.ts          # módulos instalados, versiones, enable/disable
│   └── reader/              # por tipo: bible/commentary/dictionary/devotion (queries FTS5)
└── apps/mobile/             # Expo Router, NativeWind/Uniwind, reanimated
```

Regla: `core` y `module-engine` no importan React; la UI consume sus APIs.

## 2. Flujo de datos (.amod en el dispositivo)

```
catalog.json (GitHub) → Biblioteca UI (fichas con license/attribution visibles)
  → instalar: download downloadUrl → sha256 == catalog.sha256 → unzip (manifest + content.db)
  → sandbox: FileSystem.documentDirectory/modules/<id>/content.db
  → abrir con expo-sqlite openDatabaseAsync({ immutable: true }) → queries
```

- `application_id` 0x414D4F44 validado al abrir; schemaVersion chequeado contra minReaderVersion.
- Actualización de módulo: re-instalar sobre versión mayor; el engine conserva notas del
  usuario (almacenadas aparte, keyed por (moduleId, book, chapter, verse)).

## 3. UI — estructura Logos, confort Alethia

- **Navegación móvil**: bottom tabs (Inicio · Biblioteca · Leer · Estudio · Buscar);
  en web export: sidebar adaptativo.
- **Tokens de tema**: los 8 tokens del legacy (--reader-bg/text/border/muted/accent/
  accent-fg/hover/accent-subtle) mapeados a design tokens NativeWind por tema
  (pergamino/sepia/noche); sin blanco puro ni negro puro.
- **Tipografías**: expo-font con OpenDyslexic/Atkinson/Literata (ttf públicos del legacy).
- **Leer**: paginación por presupuesto de alto con onLayout (equivalente del DOM measuring),
  verse-super, headings, notas al pie con Tooltip long-press, marcadores, VerseModal sheet.
- **Estudio**: panel comentario sincronizado por pasaje (mismo (book,chapter,verse) del
  lector), lookup de diccionario por long-press de palabra → búsqueda FTS5.
- **Buscar**: FTS5 global por módulo con `unicode61 remove_diacritics 2` ("Jesús" ≈ "jesus").

## 4. TTS (diseño absorbido de alethia-universal)

- `TTSOrchestrator` en core: cola por versículo, boundary events para resaltado bimodal,
  cancelación con referencia local (lección del fix de pausa del legacy).
- ExpoSpeechEngine (móvil): expo-speech con `useApplicationAudioSession: false`,
  config plugin `UIBackgroundModes: [audio]`, lock screen controls vía expo-audio
  `setActiveForLockScreen` (metadata: libro/capítulo/versículo).
- WebSpeechEngine + PiperWasmEngine (web export): paridad con legacy.
- SherpaPiperEngine (premium offline): modelos Piper es_ES on-demand — fase F4+, no v1.

## 5. Fases (tasks.md)

| Fase | Entregable verificable |
|------|------------------------|
| F0 | monorepo + core + module-engine (catalog/installer/registry) + typecheck verde |
| F1 | app Expo + temas + instalar ASV desde el catálogo real + leer Génesis 1 |
| F2 | lector paginado paridad (fixture visual vs legacy) + marcadores + VerseModal |
| F3 | TTS nativo + background iOS + lock screen + resaltado bimodal |
| F4 | Estudio (comentario sincronizado, diccionario) + Buscar FTS5 + Inicio dashboard |
| F5 | EAS tiendas + OTA + export web + auditoría |

## 6. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Paginación RN ≠ DOM | fixture comparativo por capítulo; tolerancia ±2%; métricas con onLayout |
| expo-sqlite FTS5 en móvil | config plugin `enableFTS: true` (default); verificado en F1 |
| Descarga inicial requiere red | catálogo cacheado; módulos en sandbox; UX de offline explícita |
| Doble mantenimiento con legacy | core compartido único; legacy congelado como referencia estable |
