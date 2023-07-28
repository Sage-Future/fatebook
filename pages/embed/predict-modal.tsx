// Exposes the Prediction component solo so it can be embeded as desired

import React, { useEffect, useRef } from "react"
import { Predict } from "../../components/Predict"


export default function PredictModal() {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    document.body.addEventListener('keydown', (e) => {
      if(e.key === "Escape") {
        window.parent.postMessage({isFatebook:true, action:"close_modal"}, '*')
      }
    })

    window.addEventListener('message', (event) => {
      if (typeof event.data === 'object' && event.data.isFatebook) {
        if(textAreaRef.current) {
          textAreaRef.current.focus()
        }
      }
    })
  }, [textAreaRef.current])

  return <div className="flex items-center justify-center w-full h-full bg-black/80 p-12">
    <div className="max-w-10xl p-10 bg-neutral-50 rounded-sm">
      <Predict textAreaRef={textAreaRef} />
    </div>
  </div>
}

// Strips away the header and footer
PredictModal.getLayout = function getLayout(page: React.ReactElement) {
  return page
}