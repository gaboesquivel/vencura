'use client'

import { Pressable, Text, View } from 'react-native'

import { dynamicClient } from '@/lib/dynamic'

export default function LoginScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-background">
      <View className="items-center gap-2 px-6">
        <Text className="text-center text-4xl font-semibold text-foreground">Sign in</Text>
        <Text className="text-center text-base text-muted-foreground">
          Tap below to sign in with Dynamic
        </Text>
        <Pressable
          onPress={() => dynamicClient.ui.auth.show()}
          className="mt-6 py-3 px-6 rounded-lg bg-primary active:opacity-80"
        >
          <Text className="text-primary-foreground font-semibold text-base">Sign in</Text>
        </Pressable>
      </View>
    </View>
  )
}
