import {
  CheckIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid"
import clsx from "clsx"
import { motion } from "framer-motion"
import { useState } from "react"
import { api } from "../../lib/web/trpc"
import { useUserId } from "../../lib/web/utils"

export function QuickFeedback({
  type,
  placeholder = "Tell us what you think...",
  title,
  className,
  btnClassname,
  style = "button",
}: {
  type: string
  placeholder?: string
  title?: string
  className?: string
  btnClassname?: string
  style?: "textarea" | "button"
}) {
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [showEmail, setShowEmail] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const submitMutation = api.feedback.submit.useMutation()
  const [showInput, setShowInput] = useState(style !== "button")

  const userId = useUserId()

  const handleSubmit = () => {
    if (!feedback) return
    submitMutation.mutate({
      type,
      message: feedback,
      email: email || undefined,
    })
    setSubmitted(true)
    setFeedback("")
    setTimeout(() => setSubmitted(false), 6000)
  }

  if (style === "button" && !showInput) {
    return (
      <button
        className={clsx("btn", btnClassname)}
        onClick={() => setShowInput(true)}
      >
        {title || placeholder}
      </button>
    )
  }

  return (
    <motion.div
      initial={style === "button" ? { opacity: 0, scale: 0.95 } : {}}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "flex flex-col gap-2 w-full max-w-prose relative",
        className,
      )}
    >
      {style === "button" && (
        <button
          className="btn btn-ghost btn-xs text-neutral-500 btn-circle absolute right-0 top-0"
          onClick={() => setShowInput(false)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
      {title && (
        <label
          htmlFor="feedback-textarea"
          className="text-sm font-semibold text-neutral-600 block"
        >
          {title}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <textarea
          id="feedback-textarea"
          placeholder={placeholder}
          className="textarea textarea-bordered flex-1 pr-10 resize-none"
          rows={feedback ? 2 : 1}
          value={feedback}
          autoFocus={style === "button"}
          onChange={(e) => {
            setFeedback(e.target.value)
            if (submitted) setSubmitted(false)
          }}
          onFocus={() => setShowEmail(true)}
        />
        <button
          className={clsx(
            "btn btn-xs w-10 h-10 btn-circle absolute right-1 top-1", // Adjust top position for alignment with textarea
            feedback && "btn-primary",
            submitted && "bg-green-500",
          )}
          onClick={() => void handleSubmit()}
          disabled={submitMutation.isLoading}
        >
          {submitted ? (
            <CheckIcon className="h-3 w-3 text-white shrink-0" />
          ) : (
            <PaperAirplaneIcon className="h-3 w-3" />
          )}
        </button>
      </div>
      {(showEmail || feedback) && !userId ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <input
            type="email"
            placeholder="Your email (optional)"
            className={clsx(
              "input input-bordered input-sm focus-within:opacity-100 w-full",
              !email && "opacity-70",
            )}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>
      ) : null}
    </motion.div>
  )
}
