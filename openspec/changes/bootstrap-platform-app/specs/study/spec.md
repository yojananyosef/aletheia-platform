## ADDED Requirements

### Requirement: Guías de estudio compuestas

El sistema SHALL generar guías de estudio que agreguen los módulos instalados por
categoría: Guía de pasajes (comentarios, referencias cruzadas, diccionarios del pasaje),
workflows con plantillas personalizables y progreso por pasos, y Estudio bíblico (builder
de bloques con preguntas extraídas de los módulos).

#### Scenario: Guía de pasajes
- **WHEN** el usuario abre la Guía de Pasajes para Juan 3
- **THEN** la guía lista comentarios que cubren el pasaje, referencias cruzadas (TSK) y
  entradas de diccionario relacionadas, con enlaces que abren cada fuente

#### Scenario: Workflow con progreso
- **WHEN** el usuario inicia un workflow de plantilla con 5 pasos
- **THEN** el progreso se persiste (x/5 pasos) y puede exportarse

### Requirement: Enciclopedia bíblica (Factbook) por entidades

El sistema SHALL construir un índice de entidades bíblicas (personas, lugares, cosas,
eventos, temas) a partir de módulos instalados (Nave como backbone), y SHALL mostrar una
ficha por entidad que agregue diccionarios, pasajes clave, referencias cruzadas y
comentarios que la mencionan, con etiquetas clicables desde el lector.

#### Scenario: Ficha de entidad
- **WHEN** el usuario consulta la entidad "David"
- **THEN** la ficha muestra definiciones de diccionarios instalados, pasajes clave y
  referencias cruzadas, con citas a los módulos fuente

#### Scenario: Etiqueta en el lector
- **WHEN** el usuario toca un nombre marcado como entidad en el texto
- **THEN** se abre la ficha Factbook correspondiente

### Requirement: Idiomas originales

Con el lote v1.1 del catálogo (WLC, SBLGNT, WHNU, Strong, Abbott-Smith, Robinson), el
sistema SHALL mostrar el verso original con lemas, vincular cada lema a su entrada de
léxico (word study) y soportar búsqueda por lema/strongs.

#### Scenario: Word study
- **WHEN** el usuario consulta el lema G3004 (λέγω) desde un pasaje interlineal
- **THEN** se muestra la definición (Abbott-Smith/Strong) y una lista de usos en el texto
