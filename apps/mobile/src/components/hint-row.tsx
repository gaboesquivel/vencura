import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type HintRowProps = {
  title?: string
  hint?: ReactNode
}

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm font-medium text-foreground">{title}</Text>
      <View className="rounded-lg py-1 px-2 bg-secondary">
        {typeof hint === 'string' ? (
          <Text className="text-sm text-muted-foreground">{hint}</Text>
        ) : (
          hint
        )}
      </View>
    </View>
  )
}
