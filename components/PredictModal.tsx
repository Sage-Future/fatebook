// Exposes the Prediction component solo so it can be embedded as desired

import { XCircleIcon } from "@heroicons/react/20/solid"
import { useSession } from "next-auth/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { copyToClipboard } from "../lib/web/clipboard"
import { sendToHost } from "../lib/web/embed"
import { makeClipboardHtmlLink, makeRichGoogleDocsLink } from "../lib/web/gdoc_rich_text"
import { Predict } from "./Predict"

export default function PredictModal() {
  const { data: session } = useSession()
  const [resetTrigger, setResetTrigger] = useState(false)

  // Listen for requests to focus the prediction modal
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!textAreaRef.current) return

    return window.addEventListener('message', (event) => {
      if (typeof event.data === 'object' && event.data.isFatebook && event.data.action === 'focus_modal') {
        textAreaRef.current!.focus()
      }
    })
  }, [])

  function cancelPrediction() {
    sendToHost("prediction_cancel")
    setResetTrigger(true)
  }

  function predictionSuccess(predictionLink: string) {
    sendToHost("prediction_create_success", {predictionLink})
    setResetTrigger(true)
  }

  // Listen for escape key within this iframe, close modal
  useEffect(() => {
    document.body.addEventListener('keydown', (e) => {
      if (e.key === "Escape") {
        cancelPrediction()
      }
    })
  }, [])

  // Callback for when user creates the prediction
  const onQuestionCreate = useCallback(({ url, title, prediction }: { url: string, title: string, prediction?:number }) => {
    // add query string
    const urlObj = new URL(url)
    urlObj.searchParams.append('ext', '1')

    const richTextData = { url: urlObj.toString(), text: title, prediction, name:session!.user.name }

    copyToClipboard({
      'text/plain': urlObj.toString(),
      ...(
        // skip HTML version for twitter (it uses that instead of the plain text version)
        window.location.ancestorOrigins.contains("https://twitter.com")
        || window.location.ancestorOrigins.contains("https://x.com") ?
        {}
        :
        makeClipboardHtmlLink(richTextData)
      ),
      ...makeRichGoogleDocsLink(richTextData)
    })

    predictionSuccess(urlObj.toString())
  }, [session])

  return <div className="flex items-center justify-center w-full h-full bg-black/80 p-12" onClick={() => cancelPrediction()}>
    <div className="relative max-w-10xl p-10 pb-8 bg-neutral-50 rounded-sm" onClick={e => e.stopPropagation()}>
      <Predict resetTrigger={resetTrigger} setResetTrigger={setResetTrigger} textAreaRef={textAreaRef} onQuestionCreate={onQuestionCreate} embedded={true}/>

      <div className="absolute w-[20px] h-[20px] top-[8px] right-[6px] text-neutral-400 cursor-pointer" onClick={() => cancelPrediction()}>
        <XCircleIcon></XCircleIcon>
      </div>

    </div>
  </div>
}

