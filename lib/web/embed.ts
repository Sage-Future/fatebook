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

export function useListenForSessionReload() {
  const { status } = useSession()

  useEffect(() => {
    const fn = () => {
      if (status === 'unauthenticated' && document.visibilityState === 'visible') {
        sendToHost('reload-me', {src: location.href})
      }
    }

    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  }, [status])
}