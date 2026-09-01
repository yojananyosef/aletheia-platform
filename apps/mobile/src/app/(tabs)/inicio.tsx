import { Link } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { useEngine } from '@/engine/provider'
import { useEffect, useState } from 'react'

export default function InicioScreen() {
  const engine = useEngine()
  const [installedCount, setInstalledCount] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    void engine.registry
      .list()
      .then((list) => {
        if (active) setInstalledCount(list.length)
      })
      .catch(() => setInstalledCount(0))
    return () => {
      active = false
    }
  }, [engine])

  return (
    <ScrollView className="flex-1 bg-reader-bg" contentContainerClassName="p-5 gap-5">
      <View className="rounded-2xl border border-reader-border bg-hover p-5 gap-2">
        <Text className="text-2xl font-bold text-reader-text">Aletheia</Text>
        <Text className="text-base text-reader-muted">
          Plataforma bíblica gratuita y abierta: módulos del catálogo oficial, siempre con su
          licencia visible.
        </Text>
      </View>

      <View className="rounded-2xl border border-reader-border p-5 gap-3">
        <Text className="text-lg text-reader-text">
          {installedCount === null
            ? 'Revisando tu biblioteca…'
            : installedCount === 0
              ? 'Aún no tienes módulos instalados.'
              : `Tienes ${String(installedCount)} módulo${installedCount === 1 ? '' : 's'} instalado${installedCount === 1 ? '' : 's'}.`}
        </Text>
        <Link href="/biblioteca" asChild>
          <Pressable
            accessibilityRole="button"
            className="min-h-[44px] items-center justify-center rounded-xl bg-accent px-5 active:bg-hover"
          >
            <Text className="text-base font-semibold text-accent-fg">Ir a la Biblioteca</Text>
          </Pressable>
        </Link>
      </View>

      <Text className="text-sm text-reader-muted">
        Inicio con devocional y versículo del día llega en la fase F4. Estudio y Buscar en F4.
      </Text>
    </ScrollView>
  )
}
