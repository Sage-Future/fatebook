import React, { useEffect } from "react"
import { useRouter } from "next/router"

// shows nothing, but starts listening for requests to load a question

export default function QuestionLoaderEmbed() {
  const router = useRouter()

  useEffect(() => {
    return window.addEventListener('message', (event) => {
      if (typeof event.data === 'object' && event.data.isFatebook && event.data.action === 'load_question') {
        router.push(`/embed/q/${event.data.questionId}`).catch(e => console.error(e))
      }
    })
  }, [router])

  return <p>a</p>
}

// Strips away the header and footer
QuestionLoaderEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}