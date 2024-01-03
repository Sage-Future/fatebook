import { patchLocalStorage } from "../lib/patchLocalStorage"
if (typeof window !== "undefined") {
  patchLocalStorage() // must run before next-auth
}

import { SessionProvider } from "next-auth/react"
import { AppProps } from "next/app"
import Head from "next/head"
import { GoogleAnalytics } from "nextjs-google-analytics"
import Meta from "../components/Meta"
import { api } from "../lib/web/trpc"
import "../styles/globals.css"
import { ReactElement, ReactNode } from "react"
import { NextPage } from "next"
import { Layout } from "../components/Layout"
import { Toaster } from "react-hot-toast"

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

function App({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>)

  const refetchOnWindowFocus =
    typeof window !== "undefined" && !location.href.includes("/embed/")

  return (
    <>
      <Meta />
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <GoogleAnalytics trackPageViews />
      <SessionProvider
        session={session}
        refetchOnWindowFocus={refetchOnWindowFocus}
      >
        {getLayout(<Component {...pageProps} />)}
        <Toaster />
      </SessionProvider>
    </>
  )
}

export default api.withTRPC(App)
