import React, { useEffect } from "react"
import "../../components/QuestionOrSignIn"
import { Toaster, toast } from 'react-hot-toast'

// shows nothing, but starts listening for requests to load a question

export default function ToastEmbed() {
  useEffect(() => {
    window.addEventListener('message', (event:MessageEvent<any>) => {
      if (typeof event.data === 'object' && event.data.isFatebook && event.data.action === 'toast') {
        // @ts-ignore
        toast[event.data.type](event.data.text)
      }
    })
  }, [])

  return <div><Toaster/></div>
}

// Strips away the header and footer
ToastEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}