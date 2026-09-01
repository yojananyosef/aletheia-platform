## ADDED Requirements

### Requirement: Workspace multi-panel con entornos

El sistema SHALL soportar un workspace de paneles (tiles con pestañas, dock, duplicar,
reabrir cerradas, cerrar otras) en web/tablet landscape, con conjuntos de enlaces A–F
(sincronización de paneles por referencia) y entornos (layouts) guardables más un conjunto
de entornos de inicio rápido.

#### Scenario: Entorno Biblia+Comentario
- **WHEN** el usuario activa el entorno "Biblia y Comentario" con dos paneles sincronizados
- **THEN** al navegar un pasaje en la Biblia, el comentario se desplaza al mismo pasaje

#### Scenario: Entorno persistente
- **WHEN** el usuario reordena o cierra paneles y reinicia
- **THEN** el entorno guardado se restaura con la misma distribución

### Requirement: Command Box con comandos

El sistema SHALL proveer un command box ("Pasaje o tema") con autocompletado que resuelva:
abrir un módulo, ir a un pasaje, buscar un término, abrir el estudio de una palabra, y
consultar una entidad del factbook.

#### Scenario: Command box resuelve pasaje
- **WHEN** el usuario escribe "Juan 3:16" y ejecuta
- **THEN** el lector abre Juan 3:16 en la Biblia preferida

#### Scenario: Command box sugiere comandos
- **WHEN** el usuario escribe "amor"
- **THEN** el autocompletado sugiere: buscar "amor" en Biblia, en módulos, y entradas
  de diccionario coincidentes

### Requirement: Favoritos y atajos

El sistema SHALL permitir guardar favoritos (recursos, pasajes, entidades, documentos) en
carpetas con quick links (Ctrl 1–6) y atajos (pins) en la barra lateral.

#### Scenario: Quick link
- **WHEN** el usuario asigna un pasaje favorito al slot 1
- **THEN** Ctrl+1 lo abre desde cualquier lugar
