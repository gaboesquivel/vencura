import { createClient } from '@dynamic-labs/client'
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension'

const environmentId = process.env.EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID
if (!environmentId) throw new Error('EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID is required')

export const dynamicClient = createClient({
  environmentId,
}).extend(ReactNativeExtension())
