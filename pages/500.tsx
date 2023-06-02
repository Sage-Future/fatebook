import Link from 'next/link'
export default function Custom500() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        <h2 className="text-3xl mb-4">
          <Link href="/" className="no-underline font-extrabold text-gray-900">
            Fatebook
          </Link>
        </h2>
        <h4>
          Sorry, looks like an error on our end. Try again, <Link href="mailto:hello@sage-future.org">email us</Link>, or <Link href="/">go home</Link>.
        </h4>
      </div>
    </div>
  )
}