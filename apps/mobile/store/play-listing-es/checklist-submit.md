# Checklist EAS Submit — Play Console (pista interna)

Foco Android+Web (iOS archivado en Deferred-iOS).

## Requisitos previos (cuenta)

- [ ] Proyecto EAS vinculado: `eas init` (genera `extra.eas.projectId` en app.json
      + canal OTA; hoy `eas.json` ya trae canales preview/production).
- [ ] Build production: `eas build --platform android --profile production` (AAB).
- [ ] Clave de servicio de Google Play (cuenta de servicio con acceso a
      "Publicar aplicaciones") para `eas submit --platform android`.

## Ficha (este directorio)

- Título: `titulo.txt` (≤30 caracteres).
- Descripción corta: `descripcion-corta.txt` (≤80).
- Descripción completa: `descripcion-larga.txt`.
- Categoría sugerida: Libros y referencia. Clasificación: Todos.
- Declaración de contenido: sin cuentas, sin anuncios, sin compras integradas;
  contenido de dominio público con licencia visible por módulo.

## Pendiente de dispositivo/tienda (no automatizable headless)

- [ ] Capturas (mínimo 2, 1080px+): Biblioteca, Leer, Estudio, Buscar.
- [ ] Icono 512×512 + gráfico de funciones 1024×500.
- [ ] Cuestionario de clasificación por edades.
- [ ] Primera subida a pista interna + `track: internal` (ya en eas.json).
- [ ] Medir en dispositivo: tamaño AAB/APK instalado, arranque frío, offline
      (modo avión con ASV instalado), TalkBack en Leer/Biblioteca.
