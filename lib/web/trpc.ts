import { TRPCClientError, httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import transformer from 'trpc-transformer'
import { AppRouter } from './app_router'
import { toast } from 'react-hot-toast'

export function getClientBaseUrl(useRelativePath = true) {
  if (typeof window !== 'undefined') {
    return useRelativePath ? '' : window.location.origin
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer,
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/ssr
           **/
          url: `${getClientBaseUrl()}/api/trpc`,

          // You can pass any HTTP headers you wish here
          headers() {
            return {
              // authorization: getAuthCookie(),
            }
          },
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            onError: (error) => {
              if (typeof window === 'undefined') return false
              if (!(error instanceof TRPCClientError)) return false
              if (error?.data?.code === 404) return false
              else {
                toast.error(`Oops, there was an error on our end. \n${error.name} ${error.message}`)
                return false
              }
            }
          },
          mutations: {
            onError: (error) => {
              if (typeof window === 'undefined') return false
              if (!(error instanceof TRPCClientError)) return false
              if (error?.data?.code === 404) return false
              else {
                toast.error(`Oops, there was an error on our end. \n${error.message}`)
                return false
              }
            }
          }
        }
      }
    }
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
})