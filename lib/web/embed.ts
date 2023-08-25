import { usePathname } from 'next/navigation'

let embedId: string|null = null

export function useIsEmbedded() {
  const pathname = usePathname()
  console.log(pathname)
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