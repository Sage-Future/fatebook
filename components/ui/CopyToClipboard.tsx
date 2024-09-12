import { ClipboardIcon } from "@heroicons/react/20/solid"
import { useEffect, useState } from "react"

export function CopyToClipboard({
  textToCopy,
  buttonLabel = "Copy link",
}: {
  textToCopy: string
  buttonLabel?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  return (
    <div>
      <button
        className="button text-xs"
        onClick={(e) => {
          e.preventDefault()
          setCopied(true)
          void navigator.clipboard.writeText(textToCopy)
        }}
      >
        <ClipboardIcon className="inline shrink-0" height={15} />
        {copied ? <span>Copied!</span> : <span>{buttonLabel}</span>}
      </button>
    </div>
  )
}
