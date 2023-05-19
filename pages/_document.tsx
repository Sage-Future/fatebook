import { Head, Html, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html className="overflow-y-scroll" lang="en">
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
