import { ClipboardIcon } from "@heroicons/react/20/solid"
import { useState } from "react"

export function CopyToClipboard({
  textToCopy
} : {
  textToCopy: string,
}) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <button
        className="button text-xs"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={async () => {
          setCopied(true)
          await navigator.clipboard.writeText(textToCopy)
        }}
      >
        <ClipboardIcon className="inline shrink-0" height={15} />
        {copied ?
          <span>Copied!</span>
          :
          <span>Copy link</span>
        }
      </button>
    </div>
  )
}