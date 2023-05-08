import { SessionProvider } from "next-auth/react"
import { AppProps } from "next/app"
import Head from "next/head"
import { GoogleAnalytics } from "nextjs-google-analytics"
import Meta from "../components/Meta"
import "../styles/globals.css"


// eslint-disable-next-line @typescript-eslint/naming-convention
export default function App({ Component, pageProps: {session, ...pageProps} }: AppProps) {
  return <>
    <Meta />
    <Head>
      <link rel="shortcut icon" href="/favicon.ico" />
    </Head>
    <GoogleAnalytics trackPageViews />
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  </>
}