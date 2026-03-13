import '@/global.css'

import { useReactiveClient } from '@dynamic-labs/react-hooks'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { createClient } from '@repo/core'
import { ApiProvider } from '@repo/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef } from 'react'
import { Platform, useColorScheme, View } from 'react-native'
import { dynamicClient } from '@/lib/dynamic'
import { env } from '@/lib/env'

const queryClient = new QueryClient()

const coreClient = createClient({
  baseUrl: env.apiUrl,
  dynamicAuth: {
    getAuthToken: () => Promise.resolve(dynamicClient.auth.token ?? null),
  },
})

export const unstable_settings = {
  initialRouteName: 'login',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const client = useReactiveClient(dynamicClient)
  const router = useRouter()
  const segments = useSegments()
  const isInitialMount = useRef(true)

  const isAuthenticated = !!client.auth.authenticatedUser

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const first = segments[0] as string
    const inTabs = first === '(tabs)' || first === 'index' || first === 'explore'
    if (isAuthenticated && !inTabs) router.replace('/(tabs)' as never)
    else if (!isAuthenticated && inTabs) router.replace('/login' as never)
  }, [isAuthenticated, segments, router])

  return (
    <>
      <dynamicClient.reactNative.WebView />
      <QueryClientProvider client={queryClient}>
        <ApiProvider client={coreClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="login" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              {Platform.OS !== 'web' && <StatusBar style="auto" />}
            </View>
          </ThemeProvider>
        </ApiProvider>
      </QueryClientProvider>
    </>
  )
}
