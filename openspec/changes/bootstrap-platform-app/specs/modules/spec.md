## ADDED Requirements

### Requirement: Consumo del catálogo oficial .amod

El sistema SHALL consumir `catalog.json` del catálogo oficial (aletheia-catalog) como única
fuente de contenido, mostrando por cada módulo su licencia, copyright y atribución antes
de la instalación, y descargando desde el `downloadUrl` declarado.

#### Scenario: Biblioteca con licencias visibles
- **WHEN** el usuario abre la pestaña Biblioteca
- **THEN** cada ficha muestra nombre, tipo, idioma, licencia y atribución del módulo

#### Scenario: Instalación verificada
- **WHEN** el usuario instala un módulo
- **THEN** el sistema descarga el .amod, valida sha256 contra el catálogo y lo extrae
  al sandbox; si el hash no coincide, aborta con error

### Requirement: Lectura de módulos en SQLite/FTS5

El sistema SHALL abrir los `content.db` instalados con expo-sqlite en modo inmutable,
validar `application_id` 0x414D4F44 y `schemaVersion ≥ minReaderVersion`, y exponer
consultas por tipo (bible/commentary/dictionary/devotion) incluyendo búsqueda FTS5
con tokenizador sin diacríticos.

#### Scenario: Leer un capítulo desde módulo
- **WHEN** el usuario abre Génesis 1 en la Biblia instalada
- **THEN** los versículos provienen del content.db del módulo (con headings y footnotes
  si el módulo los declara)

#### Scenario: Búsqueda sin acentos
- **WHEN** el usuario busca "jesus" en contenido con "Jesús"
- **THEN** FTS5 con unicode61 remove_diacritics 2 encuentra coincidencias

#### Scenario: Módulo corrupto o ilegible
- **WHEN** el application_id o schemaVersion no corresponden
- **THEN** el módulo se marca como dañado y se ofrece reinstalar
