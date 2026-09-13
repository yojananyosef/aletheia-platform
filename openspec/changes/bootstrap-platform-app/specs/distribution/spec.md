## ADDED Requirements

### Requirement: Distribución EAS Android+Web (iOS diferido)

El proyecto SHALL compilar y distribuir mediante EAS con foco Android+Web: perfiles
preview (APK interno) y production (AAB para Play Console), con export web funcional
y updates OTA vía EAS Update. iOS (IPA + App Store Connect + pantalla bloqueada +
lock-screen) queda archivado como pista separada (ver `tasks.md` Deferred-iOS).

#### Scenario: Build de tiendas
- **WHEN** se ejecuta EAS Build con perfil production y EAS Submit
- **THEN** el AAB llega a Play Console; el export web se publica como estático

#### Scenario: OTA sin tienda
- **WHEN** se publica un fix JS-only
- **THEN** los dispositivos instalados lo reciben por EAS Update al siguiente arranque

### Requirement: Paralelismo con el ecosistema existente

El proyecto SHALL operar en paralelo sin modificar el ecosistema existente
(aletheia-reader en Vercel, aletheia-bridge, aletheia-modules, aletheia-gateway); el único
acoplamiento permitido es el consumo del catálogo publicado por aletheia-catalog.

#### Scenario: Ecosistema intacto
- **WHEN** cualquier fase avanza
- **THEN** ningún repo hermano se modifica; el catálogo se consume vía su URL pública
