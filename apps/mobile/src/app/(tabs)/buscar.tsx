import { Text, View } from 'react-native'

export default function BuscarScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-reader-bg p-6">
      <Text className="text-center text-base text-reader-text">Buscar (FTS5)</Text>
      <Text className="text-center text-sm text-reader-muted">
        Búsqueda global con tokenizer unicode61 remove_diacritics 2 llega en la fase F4.
      </Text>
    </View>
  )
}
