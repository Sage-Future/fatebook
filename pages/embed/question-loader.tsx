import React, { useEffect } from "react"
import { useRouter } from "next/router"
import { sendToHost, useListenForSessionReload } from "../../lib/web/embed"
import "../../components/QuestionOrSignIn" // ensure code we need is pre-loaded

// shows nothing, but starts listening for requests to load a question

let runOnce = false
export default function QuestionLoaderEmbed() {
  const router = useRouter()

  useEffect(() => {
    if (!router) return
    if (runOnce) return

    runOnce = true
    window.addEventListener('message', (event: MessageEvent<any>) => {
      if (typeof event.data !== 'object' || !event.data.isFatebook) return

      if (event.data.action === 'load_question') {
        router.push(`/embed/q/${event.data.questionId}${window.location.search}`).catch(e => console.error(e))
      }
    })

    sendToHost('question_loader_listening')

    // warning: don't deregister, else we can't navigate more than once
  }, [])

  useListenForSessionReload()

  return null
}

// Strips away the header and footer
QuestionLoaderEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}