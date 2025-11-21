import { getPageImage, source } from '@/lib/source'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { getMDXComponents } from '@/mdx-components'
import type { Metadata } from 'next'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {/* @ts-expect-error - React type version mismatch between fumadocs-ui and app React types */}
      <DocsTitle>{page.data.title}</DocsTitle>
      {/* @ts-expect-error - React type version mismatch between fumadocs-ui and app React types */}
      <DocsDescription>{page.data.description}</DocsDescription>
      {/* @ts-expect-error - React type version mismatch between fumadocs-ui and app React types */}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page) as any,
          } as MDXComponents)}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  }
}
