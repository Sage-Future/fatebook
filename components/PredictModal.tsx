// Exposes the Prediction component solo so it can be embedded as desired

import { XCircleIcon } from "@heroicons/react/20/solid"
import { useSession } from "next-auth/react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { copyToClipboard } from "../lib/web/clipboard"
import { sendToHost } from "../lib/web/embed"
import {
  makeClipboardHtmlLink,
  makeRichGoogleDocsLink,
} from "../lib/web/gdoc_rich_text"
import { Predict } from "./Predict"

export default function PredictModal() {
  const { data: session } = useSession()
  const [resetTrigger, setResetTrigger] = useState(false)
  const [defaultText, setDefaultText] = useState("")

  // Listen for requests to focus the prediction modal
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!textAreaRef.current) return

    return window.addEventListener("message", (event) => {
      if (
        typeof event.data === "object" &&
        event.data.isFatebook &&
        event.data.action === "focus_modal"
      ) {
        textAreaRef.current?.focus()
        if (event.data?.defaultText) {
          setDefaultText(event.data.defaultText)
        }
      }
    })
  }, [])

  function cancelPrediction() {
    setDefaultText("")
    sendToHost("prediction_cancel")
    setTimeout(() => setResetTrigger(true))
  }

  function predictionSuccess(predictionLink: string) {
    setDefaultText("")
    sendToHost("prediction_create_success", { predictionLink })
    setTimeout(() => setResetTrigger(true))
  }

  // Listen for escape key within this iframe, close modal
  useEffect(() => {
    document.body.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        cancelPrediction()
      }
    })
  }, [])

  // Callback for when user creates the prediction
  const onQuestionCreate = useCallback(
    ({
      url,
      title,
      prediction,
    }: {
      url: string
      title: string
      prediction?: number
    }) => {
      // add query string
      const urlObj = new URL(url)
      urlObj.searchParams.append("ext", "1")

      const richTextData = {
        url: urlObj.toString(),
        text: title,
        prediction,
        name: session!.user.name,
      }

      copyToClipboard({
        "text/plain": urlObj.toString(),
        ...// skip HTML version for twitter (it uses that instead of the plain text version)
        (window.location.ancestorOrigins.contains("https://twitter.com") ||
        window.location.ancestorOrigins.contains("https://x.com")
          ? {}
          : makeClipboardHtmlLink(richTextData)),
        ...makeRichGoogleDocsLink(richTextData),
      })

      predictionSuccess(urlObj.toString())
    },
    [session],
  )
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setStartPosition({
      x: e.clientX - dragPosition.x,
      y: e.clientY - dragPosition.y,
    })
    modalRef.current!.style.transition = "none"
  }
  const stopDrag = () => {
    setIsDragging(false)
    modalRef.current!.style.transition = "all 0.2s"
  }
  useEffect(() => {
    if (!modalRef.current) return
    modalRef.current.style.transform = `translate(${dragPosition.x}px, ${dragPosition.y}px)`
  }, [dragPosition])

  return (
    <div
      className="flex items-center justify-center w-full h-full bg-black/40 p-12"
      onClick={() => cancelPrediction()}
      onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return
        const newX = e.clientX - startPosition.x
        const newY = e.clientY - startPosition.y
        setDragPosition({ x: newX, y: newY })
      }}
      onMouseUp={stopDrag}
    >
      <div
        ref={modalRef}
        className="relative max-w-10xl p-10 pb-8 bg-neutral-50 rounded-sm"
        onMouseDown={startDrag}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => e.stopPropagation()}
        style={{ position: "absolute", cursor: "grab" }}
      >
        <Predict
          resetTrigger={resetTrigger}
          setResetTrigger={setResetTrigger}
          textAreaRef={textAreaRef}
          onQuestionCreate={onQuestionCreate}
          embedded={true}
          questionDefaults={{
            title: defaultText,
          }}
        />

        <div
          className="absolute w-[20px] h-[20px] top-[8px] right-[6px] text-neutral-400 cursor-pointer"
          onClick={() => cancelPrediction()}
        >
          <XCircleIcon></XCircleIcon>
        </div>
      </div>
    </div>
  )
}
