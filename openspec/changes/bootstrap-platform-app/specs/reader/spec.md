## ADDED Requirements

### Requirement: Lector paginado e-ink con paridad de confort

El lector SHALL presentar capítulos en páginas discretas con verse-super, encabezados de
sección, notas al pie y continuaciones, paginando por presupuesto de alto medido con
onLayout, y SHALL soportar los tres temas (pergamino/sepia/noche), fuentes accesibles
(OpenDyslexic/Atkinson Hyperlegible/Literata), lecturas biónica y silábica, line focus
TDAH y targets táctiles ≥44px.

#### Scenario: Paginación equivalente
- **WHEN** se renderiza un capítulo con headings y versículos largos
- **THEN** ninguna página excede el viewport (tolerancia ±2%) y las continuaciones no
  repiten verse-super

#### Scenario: Cambio de tema en runtime
- **WHEN** el usuario cambia de tema en Ajustes
- **THEN** los 8 tokens de tema cambian sin reinicio de app

#### Scenario: Tooltip de nota al pie
- **WHEN** el usuario mantiene presionado un indicador de nota
- **THEN** aparece un tooltip temado con el texto de la nota (sin tooltips nativos)

### Requirement: Posición persistente y marcadores

El sistema SHALL persistir la posición de lectura por (módulo, libro, capítulo, página) y
los marcadores del usuario localmente, restaurándolos al reabrir.

#### Scenario: Reanudar lectura
- **WHEN** el usuario reabre la app
- **THEN** se restaura el último pasaje leído del último módulo utilizado
