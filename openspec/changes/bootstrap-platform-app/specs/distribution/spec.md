## ADDED Requirements

### Requirement: Distribución EAS universal

El proyecto SHALL compilar y distribuir mediante EAS: perfiles preview (APK/IPA internos)
y production (AAB/IPA para Play Console y App Store Connect), con export web funcional
y updates OTA vía EAS Update.

#### Scenario: Build de tiendas
- **WHEN** se ejecuta EAS Build con perfil production y EAS Submit
- **THEN** el AAB llega a Play Console y el IPA a App Store Connect

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
