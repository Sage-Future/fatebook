import { GoogleAnalytics } from "nextjs-google-analytics"
import Meta from "../components/Meta"
import "../styles/globals.css"
import { AppProps } from "next/app"
import Head from "next/head"

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Meta />
    <Head>
      <link rel="shortcut icon" href="/favicon.ico" />
    </Head>
    <GoogleAnalytics trackPageViews />
    <Component {...pageProps} />
  </>
}