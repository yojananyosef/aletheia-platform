import '../global.css'

import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { themeTokens } from '@aletheia/core'

import { EngineProvider } from '@/engine/provider'
import { SettingsProvider, useSettings } from '@/engine/settings'

SplashScreen.preventAutoHideAsync()

const FONT_FILES = {
  OpenDyslexic: require('@/assets/fonts/OpenDyslexic-Regular.ttf'),
  OpenDyslexicBold: require('@/assets/fonts/OpenDyslexic-Bold.ttf'),
  AtkinsonHyperlegible: require('@/assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
  AtkinsonHyperlegibleBold: require('@/assets/fonts/AtkinsonHyperlegible-Bold.ttf'),
  Literata: require('@/assets/fonts/Literata-Regular.ttf'),
  LiterataBold: require('@/assets/fonts/Literata-Bold.ttf'),
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts(FONT_FILES)

  useEffect(() => {
    if (fontsLoaded || fontsError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontsError])

  if (!fontsLoaded && !fontsError) return null

  return (
    <EngineProvider>
      <SettingsProvider>
        <RootChrome />
      </SettingsProvider>
    </EngineProvider>
  )
}

function RootChrome() {
  const { settings } = useSettings()
  const tokens = themeTokens(settings.theme)
  return (
    <>
      <StatusBar style={settings.theme === 'noche' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.readerBg },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
