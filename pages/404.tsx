import { NextSeo } from 'next-seo'
import Link from 'next/link'
export default function Custom404() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="404: Page not found" />
      <div className="prose mx-auto">
        <h4>
          404: Page not found. <Link href="/">Go home</Link>
        </h4>
      </div>
    </div>
  )
}