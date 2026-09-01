# Inventario completo de funcionalidades de Logos → mapa de Aletheia Platform

Fuente: HTML completo de `app.logos.com` (Edición gratuita, es-ES) — toolbar + JSON
`localized-resources` con toda la superficie del producto. Fecha: 2026-09-01.

Cada funcionalidad recibe: **nombre Logos → nuestro equivalente (gratuito/abierto) → fase**.
Las fases referencian `openspec/changes/bootstrap-platform-app/tasks.md`.

## A. Navegación principal

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Go Box ("Pasaje o tema", comandos con autocompletado: recurso/factbook/estudio de palabra/búsqueda bíblica) | Command Box con sugerencias (pasaje, módulo, tema, búsqueda) | F6 |
| Panel de Control (dashboard) | Inicio (dashboard con tarjetas configurables) | F4 (v1) → F6 (tarjetas configurables) |
| Biblioteca | Biblioteca (catálogo oficial con fichas/licencias) | F1 |
| Buscar | Buscar (FTS5 global) | F4 |
| Biblia (botón rápido) | Biblia (abrir módulo biblia preferido) | F1 |
| Asistente de estudio (IA cloud) | **Asistente local** (RAG offline sobre módulos: embeddings sqlite-vec + citas reales) | F13 |
| Enciclopedia bíblica (Factbook) | Factbook: agregador de entidades sobre módulos (Nave + ISBE + TSK como base) | F11 |
| Guías de Estudio | Guías: pasaje, exegética, palabra; plantillas (workflows) | F10 |
| Notas | Notas (completo, ver §D) | F7 |
| Herramientas | Herramientas (menú de herramientas instalables) | F6+ |
| Acciones Rápidas (comentario, biblia de estudio, comparar versiones, diccionario, devocional de hoy) | Acciones rápidas idénticas (según módulos instalados) | F6 |
| Accesos directos (drag & drop) | Atajos (pin de recursos/pasajes) | F6 |
| Centro de ayuda | Ayuda local (docs embebidos) | F5 |
| Entornos (layouts de paneles) | Entornos: layouts guardables + de inicio rápido | F6 |
| Cerrar todos los paneles | Ídem | F6 |
| Perfil / Tienda | Sin cuenta ni tienda en v1; Tienda = catálogo oficial | F1 |

## B. Lector de recursos (resource viewer)

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Barra lateral: tabla de contenidos | TOC por capítulos/headings | F2 |
| Barra de navegación (locator: ir a libro/capítulo/versículo) | Locator bar | F2 |
| Búsqueda interna (versículo/frase/párrafo/artículo) | Inline search FTS5 sobre el módulo abierto | F8 |
| Interlineal inverso + edición de lector | Interlineal por lema con módulos originales (WLC/SBLGNT + Strong) | F12 |
| Zoom / tamaño real / ajustar | Zoom texto (tamaño fuente ya heredado) + zoom página | F2/F6 |
| Vista por páginas (columnas 1–4/auto, notas en página) | Columnas (1/2/auto) | F2 |
| Apariencia (color original, B&N, imágenes) | Temas 3 + modo B&N opcional | F2 |
| Filtros visuales (solo texto bíblico, indicadores de aparato, números, correspondencias…) | Filtros: solo texto, números de v., notas on/off | F2; resto v1.2 |
| Enfatizar (palabras de Cristo en rojo, resaltados populares, resultados, entrada de diccionario actual) | Palabras de Jesús en rojo (si módulo lo marca), resaltados y resultados propios | F7 |
| Etiquetas de la Enciclopedia (personas/lugares/cosas/pronombres/sujetos implícitos) | Etiquetas de entidad sobre texto (requiere módulo de entidades: Nave) | F11 |
| Marcadores (oradores, destinatarios, participantes de cláusula, multimedia del pasaje, eventos cronología) | Marcadores básicos (orador/destinatario si el módulo los trae) | v1.2 |
| Cinta de planes de lectura en el recurso | Recordatorio de plan en el lector | F9 |
| Filtro por listas de pasajes | Filtrar pasajes por lista propia | F8 |
| Reformatear (solo texto, formato de bosquejo, esquemas proposicionales, discurso griego/hebreo) | Modo bosquejo (outline) del texto | v1.2 (esquemas = F13 semántico o manual) |
| Información del recurso (copyright, series, info auxiliar) | Ficha "Acerca de" del módulo (ya en manifest) | F1 |
| Ideas/insights (información del pasaje, historia textual, uso AT→NT, pasajes paralelos, xrefs) | Insights v1: referencias cruzadas (TSK) + pasajes paralelos (harmony) | F11 |
| Resumir (IA) | Resumen local extractivo (opcional, sin cloud) | F13 |
| Traducir | Fuera de alcance v1 (requiere servicio); opcional futuro | — |
| Leer en voz alta (narradores, indicador palabra-por-palabra) | TTS bimodal (nuestro core) + karaoke palabra-por-palabra | F3 |
| Copiar (5+ formatos: solo texto, formateado, 1v/línea, copiar versículos, cita con estilo) | Copiar: texto simple, 1v/línea, con referencia; estilos de cita en F8 | F8 |
| Enviar a (gráficos, recortes, lienzo, lista de pasajes, diagrama, búsqueda, bibliografía, filtro visual, lista de palabras) | Send-to: recortes, lista de pasajes, búsqueda, nota | F8 |
| Conjuntos de enlaces (A–F: paneles sincronizados por referencia) | Link sets (sincronizar paneles por pasaje) | F6 |
| Historial del panel (atrás/adelante por panel) | Historial por panel | F6 |
| Comandos de panel (dock, duplicar, reabrir cerradas, cerrar otras/derecha) | Ídem | F6 |
| Pantalla completa de lectura | Modo inmersivo (ya heredado del legacy) | F2 |

## C. Buscar

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Tipos: Biblia, Libros, Artículos, Enciclopedia, Morfología, Documentos, Mapas, Multimedia, Cláusula, Sintaxis | Biblia, Libros (módulos), Documentos propios, Enciclopedia | F4 (biblia+libros) → F11 (enciclopedia) |
| Motor Preciso (léxico FTS) | FTS5 (nuestro motor único) | F4 |
| Motor Inteligente (semántico, preguntas naturales) | Búsqueda semántica local (sqlite-vec sobre módulos; preguntas naturales) | F13 |
| Coincidir mayúsculas/formas de palabra/referencias | matchCase + todas las formas ( stemming limitado FTS5; amplio/estrecho por referencia) | F8 |
| Colecciones de búsqueda (biblias favoritas, abiertos, todos los libros, morfológicos, personalizado) | Colecciones: módulos instalados por tipo/idioma | F8 |
| Sintaxis avanzada (Y/O/NO/ANTES/CERCA/DENTRO N palabras/ENTONCES; keyword:value: orador:, strongs:, lema:, persona:, lugar:, tema:…) | DSL de búsqueda propia (fases: operadores básicos F8 → keywords strongs/lema F12) | F8/F12 |
| Contextualización (agrupar por versículo/oración/párrafo/artículo; coincidir dentro) | Agrupación de resultados (versículo/capítulo) | F8 |
| Historial de búsquedas | Historial local | F8 |
| Sinopsis inteligente (IA sobre resultados) | Sinopsis local extractiva (sin cloud) | F13 |

## D. Notas y resaltados

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Notas ancladas a pasajes/libros (múltiples anclajes) | Notas ancladas a (módulo, libro, cap., versículo, rango) | F7 |
| Cuadernos (notebooks) | Cuadernos | F7 |
| Papelera / restaurar | Papelera | F7 |
| Etiquetas + iconos + colores | Etiquetas + colores | F7 |
| Estilos de resaltado: colores sólidos + ~80 marcadores temáticos (expiación, pacto, amor de Dios…, inductivo/precepto) | Colores sólidos + conjunto de marcadores temáticos propios (nuestro diseño, sin copiar su paleta) | F7 |
| Editor masivo (bulk) | Bulk edit básico | v1.2 |
| Enviar notas a sermón | Send-to documento | F8 |
| Orden por creación/modificación/cuaderno/referencia | Orden básico | F7 |
| Compartir cuadernos (grupos) | Export/import local (archivo compartible) | F8; sync grupo = roadmap |

## E. Documentos (local-first)

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Listas de pasajes (drag&drop, títulos, orden) | Listas de pasajes | F8 |
| Listas de oración (calendarizadas, contestadas) | Lista de oración v1 (estados básicos) | F8 |
| Listas de palabras | Listas de palabras (lema/strong) | F12 |
| Recortes (clippings) | Recortes | F8 |
| Bibliografía (con citas y estilos) | Bibliografía con estilos de cita | F8 |
| Copiar versículos bíblicos (formatos personalizables) | Copiar versículos (formato configurable) | F8 |
| Estudio bíblico (builder con bloques, preguntas de biblioteca) | Estudio bíblico (bloques + preguntas desde módulos) | F10 |
| Sermón: builder + presentador + asistente IA + programador/calendario litúrgico/leccionarios + export PPT/HTML/RTF | Sermón v1: editor + bosquejo + export HTML/Markdown; presentador simple | F9+ (roadmap F14) |
| Lienzo (canvas: imágenes, dibujo, visual copy) | Fuera de v1; roadmap (compose/export imagen) | — |
| Diagrama de oración | Fuera de alcance (requiere dataset morfológico profundo) | — |
| Búsqueda sintáctica (editor de árboles gramaticales) | Fuera de alcance v1 | — |
| Filtros visuales (documentos de filtro) | Filtros simples integrados (§B) | F2 |
| Estilos de resaltado / colecciones de recursos (docs) | Estilos: settings; Colecciones: doc propio | F7/F8 |
| Compartir documentos (privado/enlace/grupos/público/colaborar) | Export/import local v1; sync self-hosted = roadmap | F8 |
| Cursos (Logos Mobile Education) | Módulos "curso" (tipo AMF futuro) | roadmap |

## F. Guías y workflows

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Guía de pasajes (comentarios, xrefs, temas, multimedia, sermones) | Guía de pasajes: comentarios + xrefs + diccionarios del pasaje | F10 |
| Análisis de texto (exegética: lemas, variantes, sentidos, gramática) | Guía exegética v1 (con catálogo original-languages F12) | F12 |
| Estudio de palabra bíblica (lemma, sentidos, ejemplos de uso) | Word study (lema → Strong → usos) | F12 |
| Pasajes paralelos | Sinopsis de evangelios (módulo armonía PD) | F11 |
| Variantes textuales / aparatos | Módulo de aparato (futuro) | roadmap |
| Plantillas de guías + Flujos de estudio (progreso por pasos, exportar) | Workflows: plantillas + progreso + export | F10 |

## G. Enciclopedia bíblica (Factbook)

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Entidades: personas, lugares, cosas, eventos | Factbook de entidades (Nave + etiquetas de módulos) | F11 |
| Artículo clave / diccionarios / teologías sistemáticas / comentarios | Agregación sobre módulos instalados por entidad | F11 |
| Pasajes clave + versículos clave | Pasajes clave desde xrefs (TSK) + Nave | F11 |
| Sentidos | Sentidos (Louw-Nida? PD? — módulo futuro) | roadmap |
| Trasfondos culturales | Módulo cultural (PD: Bible History/Old Testament? — roadmap) | — |
| Hoy en la historia cristiana | Contenido propio PD o feed local | roadmap |

## H. Herramientas especializadas

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Atlas focalizado (mapas por era, estilos) | Módulo de mapas (imágenes PD/CC tipo AMF v2 "media") | roadmap |
| Explorador bíblico (facets → listas de pasajes) | Explorador (facets de Nave/entidades) | F11 |
| Gráficos (resultados por libro/capítulo, frecuencias) | Gráficos de resultados de búsqueda (barras por libro) | F13 |
| Multimedia + visual copy (diapositivas) | Media module + export imagen (roadmap) | — |
| Cronología (timeline universal, eras, swimlanes) | Timeline básico (eventos de entidades desde módulo) | F11+ |
| Comparación de texto (versos lado a lado, % diferencia, interlineal) | Comparación de Biblias lado a lado con diff | F14 |
| Traducir | Fuera de alcance | — |
| Gráficos/sintaxis/diagramas | Fuera de alcance v1 | — |

## I. Panel de Control (Inicio)

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Versículo del día | Versículo del día (rotación propia PD en core) | F4 |
| Devocional diario (SME) | Devocional del día (módulo SME) | F4 |
| Planes de lectura (tuyos + explorar) | Planes (F9) | F9 |
| Lista de oración | Lista de oración (F8) | F8 |
| Layouts de inicio rápido (biblia+comentario, devocional, estudio griego…) | Entornos de inicio rápido (los 12 equivalentes) | F6 |
| Asistente de inicio (wizard: personal/grupo/sermón/idioma original) | Wizard de bienvenida (estudio personal / grupo roadmap) | F6 |
| Buscador de inicio (pregunta o tema → biblia/todo/asistente) | Search bar Inicio → biblia/todo/asistente local | F4/F13 |
| Hoy en historia cristiana / fragmentos / santos | Roadmap (contenido propio) | — |

## J. Configuración y accesibilidad

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Modo Vista limitada (lectores de pantalla: sin notas/resaltados/herramientas) | Modo lectura simple (a11y AAA — ya es nuestro ADN) | F2 |
| Tema de aplicación (sistema/claro/oscuro) | Temas pergamino/sepia/noche (+auto) | F1 |
| Estilo de cita + copiar citas con hyperlink | Estilos de cita + hyperlink al abrir | F8 |
| Barra de herramientas izquierda/arriba | Toolbar configurable | F6 |
| Idioma de interfaz | es-ES nativo (multi-idioma roadmap) | v1 |
| Atajos de teclado globales | Atajos (F-sets del legacy + quick links Ctrl 1–6) | F6 |

## K. Comunidad / sincronización

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Documentos compartidos por grupos/colaboración | Export/import de documentos como archivo (portable JSON) | F8 |
| Leer juntos (planes en grupo, con fecha fija) | Roadmap (requiere backend self-hosted opcional) | — |
| Grupos Faithlife | Fuera de alcance v1 | — |

## L. Tienda y catálogo

| Logos | Aletheia Platform | Fase |
|---|---|---|
| Tienda (compra, colecciones, prepub, libro del mes) | Biblioteca = catálogo oficial gratuito; "módulo del mes" destacado; peticiones vía GitHub Issues | F1 |

## Reglas de prioridad derivadas

1. Todo lo que hace que **leer + escuchar + guardar progreso** funcione impecable (F0-F5).
2. Workspace multi-panel + command box = la firma de Logos (F6) — antes de tools avanzadas.
3. Notas/resaltados completos (F7) antes de documentos compuestos (F8-F9).
4. Guías/Factbook dependen del **lote v1.1 del catálogo** (TSK, Nave, Easton, ISBE, WLC, SBLGNT, Strong, Robinson) → coordinar con aletheia-catalog.
5. Semántica local (F13) reemplaza todas las features "IA de Logos" sin cloud ni créditos.
