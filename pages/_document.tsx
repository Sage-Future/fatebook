import { DocumentProps, Head, Html, Main, NextScript  } from "next/document"
import clsx from "clsx"

export default function Document(props:DocumentProps) {
  const embedded = props.__NEXT_DATA__.page.includes('/embed/')

  return (
    <Html
      className={clsx(
        embedded && "overflow-hidden",
        !embedded && "overflow-y-auto",
      )}
      lang="en"
    >
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        {/* <meta name="viewport" content="viewport-fit=cover" /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
