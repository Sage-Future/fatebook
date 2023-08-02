// Exposes the Prediction component solo so it can be embeded as desired

import React, { useCallback, useEffect, useRef } from "react"
import { copyToClipboard } from "../lib/web/clipboard"
import { Predict } from "./Predict"
import { makeRichGoogleDocsLink } from "../lib/web/gdoc_rich_text"
import { XCircleIcon } from "@heroicons/react/20/solid"


function closeModal() {
  window.parent.postMessage({ isFatebook: true, action: "close_modal" }, '*')
}

function focusParent() {
  window.parent.postMessage({ isFatebook: true, action: "focus_parent" }, '*')
}

export default function PredictModal() {
  // Listen requests to focus the prediction modal
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!textAreaRef.current) return

    return window.addEventListener('message', (event) => {
      if (typeof event.data === 'object' && event.data.isFatebook && event.data.action === 'focus_modal') {
        textAreaRef.current!.focus()
      }
    })
  }, [textAreaRef.current])

  // Listen for escape key within this iframe, close modal
  useEffect(() => {
    document.body.addEventListener('keydown', (e) => {
      if (e.key === "Escape") {
        closeModal()
      }
    })
  }, [])

  // Callback for when user creates the prediction
  const onQuestionCreate = useCallback(({ url, title }: { url: string, title: string }) => {
    copyToClipboard({ 'text/plain': url, ...makeRichGoogleDocsLink({ url, text: title }) })
    focusParent()
    closeModal()
  }, [])

  return <div className="flex items-center justify-center w-full h-full bg-black/80 p-12">
    <div className="relative max-w-10xl p-10 pb-8 bg-neutral-50 rounded-sm">
      <Predict textAreaRef={textAreaRef} onQuestionCreate={onQuestionCreate} />

      <div className="absolute w-[20px] h-[20px] top-[8px] right-[6px] text-neutral-400 cursor-pointer" onClick={() => closeModal()}>
        <XCircleIcon></XCircleIcon>
      </div>

    </div>
  </div>
}

