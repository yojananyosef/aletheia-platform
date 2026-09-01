import { Text, View } from 'react-native'

export default function EstudioScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-reader-bg p-6">
      <Text className="text-center text-base text-reader-text">Estudio sincronizado</Text>
      <Text className="text-center text-sm text-reader-muted">
        Panel de comentario por pasaje y lookup de diccionario llega en la fase F4.
      </Text>
    </View>
  )
}
