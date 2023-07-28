import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html className="overflow-y-auto" lang="en">
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
