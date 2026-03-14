import { ClientHydrationWrapper } from '@/components/client-hydration-wrapper'
import { MathlerGame } from '@/components/mathler-game'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <ClientHydrationWrapper>
        <MathlerGame />
      </ClientHydrationWrapper>
    </main>
  )
}
