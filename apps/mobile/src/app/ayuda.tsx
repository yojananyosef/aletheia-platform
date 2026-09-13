import { router } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

/**
 * Ayuda local embebida (F5, foco Android+Web): contenido estatico offline,
 * sin red. Cubre instalacion de modulos, lectura, TTS y problemas conocidos.
 */
export default function AyudaScreen() {
  return (
    <View className="flex-1 bg-reader-bg">
      <View className="flex-row items-center gap-2 border-b border-reader-border px-4 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 active:bg-hover"
        >
          <Text className="text-xl text-reader-text">‹</Text>
        </Pressable>
        <Text className="text-lg font-bold text-reader-text">Ayuda</Text>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-5 pb-10">
        <Section title="Empezar">
          <Body>
            1. Abre la Biblioteca y toca Instalar en un módulo del catálogo oficial (p. ej. ASV,
            ~3 MB). 2. Abre Leer: el capítulo se lee desde el módulo instalado, sin red. 3. La
            posición y los marcadores se guardan en el dispositivo.
          </Body>
        </Section>
        <Section title="Módulos y licencias">
          <Body>
            Cada ficha muestra su licencia y atribución. Los módulos se validan por sha256 contra
            el catálogo antes de instalarse. Desactivar un módulo lo oculta sin borrarlo.
          </Body>
        </Section>
        <Section title="Lectura en voz alta (TTS)">
          <Body>
            En Leer, toca 🔊 para narrar el capítulo con resaltado del versículo en curso. Tocar
            otro versículo mientras suena salta la narración ahí. En Android el emulador suele
            correr sin audio: los estados (Leyendo/Pausado) se verifican igual.
          </Body>
        </Section>
        <Section title="Buscar y Estudiar">
          <Body>
            Buscar usa FTS5 sobre los módulos instalados (insensible a mayúsculas y diacríticos).
            Estudio sigue tu posición de lectura o un enlace ?osis=&chapter=&verse= y muestra el
            comentario y el diccionario instalados (JFB y Smith por defecto).
          </Body>
        </Section>
        <Section title="Problemas conocidos">
          <Body>
            Tras varios Fast Refresh seguidos en Expo Go, el puente de expo-sqlite puede colgarse
            (chip «FTS5 no soportado», Leer vacío): haz force-stop y relanza, no es un bug de tus
            datos. La instalación persiste tras reiniciar.
          </Body>
        </Section>
        <Section title="Sin conexión">
          <Body>
            Todo lo instalado funciona offline. Solo la primera descarga del catálogo y de cada
            .amod necesita red.
          </Body>
        </Section>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2 rounded-2xl border border-reader-border p-5">
      <Text className="text-xs font-bold uppercase text-reader-muted">{title}</Text>
      {children}
    </View>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm leading-6 text-reader-text">{children}</Text>
}
