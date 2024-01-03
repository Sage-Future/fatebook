import { ClipboardIcon } from "@heroicons/react/20/solid"
import { useState } from "react"

export function CopyToClipboard({
  textToCopy,
  buttonLabel = "Copy link",
}: {
  textToCopy: string
  buttonLabel?: string
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <button
        className="button text-xs"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={async (e) => {
          e.preventDefault()
          setCopied(true)
          await navigator.clipboard.writeText(textToCopy)
        }}
      >
        <ClipboardIcon className="inline shrink-0" height={15} />
        {copied ? <span>Copied!</span> : <span>{buttonLabel}</span>}
      </button>
    </div>
  )
}
