import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Script from "next/script"

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    heap: {
      identify: (email: string) => void
      addUserProperties: (properties: { [key: string]: any }) => void
    }
  }
}

export function HeapAnalytics() {
  const { data: session, status } = useSession()
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && window.heap) {
      console.info("Identifying Heap User...")
      window.heap.identify(session.user.email)
      window.heap.addUserProperties({
        name: session.user.name,
        userId: session.user.id,
      })
    }
  }, [scriptLoaded, session, status])

  const scriptReady = () => {
    if (window.heap) {
      setScriptLoaded(true)
    }
  }

  return (
    <Script
      id="heap-analytics"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
      window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://cdn.heapanalytics.com/js/heap-"+e+".js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a);for(var n=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],o=0;o<p.length;o++)heap[p[o]]=n(p[o])};
      heap.load("${process.env.NEXT_PUBLIC_HEAP_ANALYTICS_ID}");
      `,
      }}
      onReady={scriptReady}
    />
  )
}
