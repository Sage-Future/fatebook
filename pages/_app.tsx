import { GoogleAnalytics } from "nextjs-google-analytics"
import Meta from "../components/Meta"
import "../styles/globals.css"
import { AppProps } from "next/app"

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function App({ Component, pageProps }: AppProps) {
  return <>
    <Meta />
    <GoogleAnalytics trackPageViews />
    <Component {...pageProps} />
  </>
}