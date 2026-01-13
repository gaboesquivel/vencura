import type { LocalAccount, Hex, TypedData, SignableMessage, TransactionSerializable } from 'viem'
import type { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm'
import type { ServerKeyShare } from '@dynamic-labs-wallet/node'

/**
 * Type for external server key shares from Dynamic SDK.
 * At runtime, these are deserialized JSON objects from the database
 * that conform to Dynamic SDK's ServerKeyShare[] structure.
 */
type ExternalServerKeyShares = unknown

/**
 * Convert SignableMessage to string for Dynamic SDK.
 */
function messageToString(message: SignableMessage): string {
  if (typeof message === 'string') return message
  if (message instanceof Uint8Array) {
    return new TextDecoder().decode(message)
  }
  if ('raw' in message) {
    if (typeof message.raw === 'string') return message.raw
    return new TextDecoder().decode(message.raw)
  }
  return String(message)
}

/**
 * Type guard to validate Dynamic SDK responses as Hex strings.
 * Dynamic SDK signing methods should return hex-encoded strings.
 */
function assertHex(value: unknown): asserts value is Hex {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new Error('Dynamic SDK signing method returned invalid hex string')
  }
}

/**
 * Create a viem LocalAccount backed by Dynamic SDK signing methods.
 * Encapsulates Dynamic SDK integration and message conversion logic.
 */
export function createDynamicLocalAccount({
  address,
  externalServerKeyShares,
  dynamicEvmClient,
}: {
  address: string
  externalServerKeyShares: ExternalServerKeyShares
  dynamicEvmClient: DynamicEvmWalletClient
}): LocalAccount {
  return {
    address: address as `0x${string}`,
    type: 'local',
    publicKey: address as `0x${string}`,
    source: 'custom',
    signMessage: async ({ message }: { message: SignableMessage }) => {
      const messageStr = messageToString(message)
      const signature = await dynamicEvmClient.signMessage({
        accountAddress: address,
        // Type assertion: externalServerKeyShares is deserialized JSON matching ServerKeyShare[]
        externalServerKeyShares: externalServerKeyShares as ServerKeyShare[],
        message: messageStr,
      })
      assertHex(signature)
      return signature
    },
    signTypedData: async <const TTypedData extends TypedData | { [key: string]: unknown }>(
      parameters: TTypedData,
    ) => {
      const signature = await dynamicEvmClient.signTypedData({
        accountAddress: address,
        // Type assertion: externalServerKeyShares is deserialized JSON matching ServerKeyShare[]
        externalServerKeyShares: externalServerKeyShares as ServerKeyShare[],
        // Type assertion: Dynamic SDK accepts loosely-typed data structures
        typedData: parameters as TypedData,
      })
      assertHex(signature)
      return signature
    },
    signTransaction: async <transaction extends TransactionSerializable = TransactionSerializable>(
      transaction: transaction,
    ) => {
      const signedTx = await dynamicEvmClient.signTransaction({
        senderAddress: address,
        // Type assertion: externalServerKeyShares is deserialized JSON matching ServerKeyShare[]
        externalServerKeyShares: externalServerKeyShares as ServerKeyShare[],
        transaction,
      })
      assertHex(signedTx)
      return signedTx
    },
  }
}
