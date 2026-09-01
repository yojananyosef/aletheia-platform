import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { themeTokens } from '@aletheia/core'

import { useSettings } from '@/engine/settings'

const TABS: Array<{
  name: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  { name: 'inicio', title: 'Inicio', icon: 'home-outline' },
  { name: 'biblioteca', title: 'Biblioteca', icon: 'library-outline' },
  { name: 'leer', title: 'Leer', icon: 'book-outline' },
  { name: 'estudio', title: 'Estudio', icon: 'layers-outline' },
  { name: 'buscar', title: 'Buscar', icon: 'search-outline' },
]

export default function TabsLayout() {
  const { settings } = useSettings()
  const tokens = themeTokens(settings.theme)
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tokens.readerBg },
        headerTintColor: tokens.readerText,
        headerShadowVisible: false,
        headerTitleStyle: { color: tokens.readerText },
        sceneStyle: { backgroundColor: tokens.readerBg },
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.readerMuted,
        tabBarStyle: { backgroundColor: tokens.readerBg, borderTopColor: tokens.readerBorder },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
