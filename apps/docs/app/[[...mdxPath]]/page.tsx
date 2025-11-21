import type { ReactNode } from 'react'
import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents as getMDXComponents } from '../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

export default async function Page(props: { params: Promise<{ mdxPath?: string[] }> }) {
  const params = await props.params
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(params.mdxPath)
  
  const components = getMDXComponents()
  const Wrapper = 'wrapper' in components && typeof components.wrapper === 'function' 
    ? (components.wrapper as (props: { toc: unknown; metadata: unknown; sourceCode: unknown; children: ReactNode }) => ReactNode)
    : undefined
  
  if (Wrapper) {
    return (
      <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
        <MDXContent {...props} params={params} />
      </Wrapper>
    )
  }
  
  return <MDXContent {...props} params={params} />
}

