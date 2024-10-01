import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import React, { useEffect, useRef } from "react"
import { QuestionOrSignIn } from "../../../components/questions/QuestionOrSignIn"
import { sendToHost, useListenForSessionReload } from "../../../lib/web/embed"

export default function QuestionEmbed() {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      <NextSeo noindex={true} nofollow={true} />
      <QuestionOrSignIn
        embedded={true}
        alwaysExpand={!router.query.compact}
        requireSignIn={router.query.requireSignIn !== "false"}
      />
    </div>
  )
}

// Strips away the header and footer
QuestionEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}
