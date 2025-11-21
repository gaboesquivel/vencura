import { Geist, Geist_Mono } from 'next/font/google'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'

import '@vencura/ui/styles/globals.css'
import 'nextra-theme-docs/style.css'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/error-boundary'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const dynamic = 'force-dynamic'

const navbar = (
  <Navbar
    logo={<b>Vencura Docs</b>}
  />
)

const footer = <Footer>MIT {new Date().getFullYear()} © Vencura.</Footer>

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        {/* Additional head tags can be added here */}
      </Head>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <Providers>
            <Layout
              navbar={navbar}
              pageMap={pageMap}
              footer={footer}
            >
              {children}
            </Layout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
