import { generate as DefaultImage } from 'fumadocs-ui/og'
import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { getPageImage, source } from '@/lib/source'

export const revalidate = false

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params
  if (!slug) notFound()
  const slugArray = Array.isArray(slug) ? slug : [slug]
  const page = source.getPage(slugArray.slice(0, -1))
  if (!page) notFound()

  return new ImageResponse(
    <DefaultImage title={page.data.title} description={page.data.description} site="My App" />,
    {
      width: 1200,
      height: 630,
    },
  )
}

export function generateStaticParams() {
  return source.getPages().map(page => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }))
}
