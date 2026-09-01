## ADDED Requirements

### Requirement: TTS bimodal con orquestador multi-motor

El sistema SHALL narrar pasajes con resaltado bimodal sincronizado (boundary events),
cola por versículo y cancelación sin errores espurios, mediante un orquestador con
motores intercambiables: expo-speech (móvil), Web Speech + Piper WASM (web).

#### Scenario: Narración con resaltado
- **WHEN** el usuario reproduce un capítulo
- **THEN** el versículo en curso se resalta con el token accent-subtle siguiendo los
  boundary events, y el pasaje avanza automáticamente

#### Scenario: Pausa durante generación
- **WHEN** el usuario pausa o cancela mientras un motor genera audio
- **THEN** la cancelación aborta con referencia local al controller y no emite errores
  de UI espurios

### Requirement: Background audio en iOS

La app SHALL continuar la narración con la pantalla bloqueada en iOS mediante
UIBackgroundModes audio, y SHALL exponer controles de lock screen con metadata del
pasaje (libro, capítulo, versículo).

#### Scenario: Pantalla bloqueada
- **WHEN** el usuario bloquea la pantalla durante la narración en iOS
- **THEN** el audio continúa y el lock screen muestra metadata con play/pause funcionales
