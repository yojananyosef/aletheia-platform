# @aletheia/mobile

App universal (iOS/Android/web) de Aletheia Platform: Expo SDK 56 + Expo Router + Uniwind (Tailwind v4).

```bash
bun install        # desde la raíz del monorepo
bunx expo start    # dentro de apps/mobile
```

- Temas: pergamino/sepia/noche (tokens en `packages/core`, variantes en `src/global.css`).
- Datos: catálogo oficial `aletheia-catalog` → módulos `.amod` en sandbox, validados por sha256.
- Fuentes accesibles: OpenDyslexic, Atkinson Hyperlegible, Literata (`assets/fonts`).
- FTS5: config plugin `expo-sqlite` con `enableFTS: true`; verificación en `src/engine/fts.ts`.
