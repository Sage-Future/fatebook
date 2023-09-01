import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

let embedId: string|null = null

export function useIsEmbedded() {
  const pathname = usePathname()
  return pathname && pathname.includes('/embed/')
}

export function getEmbedId() {
  if (!embedId) {
    const url = new URL(location.href)
    embedId = url.searchParams.get("fatebook-embed-id") // make robust against url changes as we do with question-loader
  }

  return embedId as string
}

export function sendToHost(action: string, data: {[i:string]:any} = {}) {
    window.parent.postMessage({ isFatebook: true, action, embedId: getEmbedId(), ...data}, '*')
}

export function useRespondToPing() {
  useEffect(() => {
    window.addEventListener('message', (event) => {
      if (typeof event.data !== 'object' || !event.data.isFatebook) return

      if (event.data.action.includes('ping-')) {
        sendToHost(event.data.action)
      }
    })
  }, [])
}

export function useListenForSessionReload() {
  const { status } = useSession()

  useEffect(() => {
    const fn = () => {
      if (status === 'unauthenticated' && document.visibilityState === 'visible') {
        // can't just location.reload, as some pages have a content security policy against it
        sendToHost('load-url', {src: location.href})
      }
    }
    document.addEventListener('visibilitychange', fn, false)
    return () => {
      document.removeEventListener('visibilitychange', fn)
    }
  }, [status])
}