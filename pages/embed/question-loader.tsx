import React, { useEffect } from "react"
import { useRouter } from "next/router"
import "../../components/QuestionOrSignIn"

// shows nothing, but starts listening for requests to load a question

function sendLoaderListening() {
  window.parent.postMessage({ isFatebook: true, action: "question_loader_listening" }, '*')
}

export default function QuestionLoaderEmbed() {
  const router = useRouter()

  useEffect(() => {
    if (!router) return

    window.addEventListener('message', (event:MessageEvent<any>) => {
      if (typeof event.data === 'object' && event.data.isFatebook && event.data.action === 'load_question') {
        router.push(`/embed/q/${event.data.questionId}`).catch(e => console.error(e))
      }
    })

    sendLoaderListening()
  }, [router])

  return null
}

// Strips away the header and footer
QuestionLoaderEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}