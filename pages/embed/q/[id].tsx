import React, { useEffect, useRef } from "react"
import { QuestionOrSignIn } from "../../../components/QuestionOrSignIn"
import { sendToHost, useListenForSessionReload } from "../../../lib/web/embed"

export default function QuestionEmbed() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const resizeObserver = new ResizeObserver(() => {
      sendToHost("resize_iframe", { box: ref.current!.getBoundingClientRect() })
    })

    resizeObserver.observe(ref.current)

    return () => resizeObserver.disconnect()
  }, [])

  useListenForSessionReload()

  return (
    <div ref={ref} className="max-h-[500px] overflow-auto bg-white">
      <QuestionOrSignIn embedded={true} alwaysExpand={true}></QuestionOrSignIn>
    </div>
  )
}

// Strips away the header and footer
QuestionEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}
