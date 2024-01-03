import { XMarkIcon } from "@heroicons/react/24/solid"
import Image from "next/image"
import Link from "next/link"
import React from "react"

export function SyncToSlack({
  url,
  listType,
  entity,
}: {
  url: string
  listType: string
  entity: {
    syncToSlackTeamId: string | null
    syncToSlackChannelId: string | null
    [key: string]: any
  }
}) {
  const [showInstructions, setShowInstructions] = React.useState(false)

  const handleShareToSlack = () => {
    void navigator.clipboard.writeText(`/forecast ${url}`)
    setShowInstructions(true)
  }

  const isSynced = entity.syncToSlackTeamId && entity.syncToSlackChannelId

  if (isSynced) {
    return (
      <div className="text-sm">
        <span className="text-neutral-500 italic">
          <Image
            src="/slack-logo.svg"
            width={30}
            height={30}
            className="m-0 -mx-2 mr-1 inline"
            alt=""
          />
          Questions in this {listType} are synced to your Slack channel.
        </span>
      </div>
    )
  }

  return (
    <div className="text-sm">
      <button className="btn" onClick={handleShareToSlack}>
        <Image
          src="/slack-logo.svg"
          width={30}
          height={30}
          className="m-0 -mx-2 inline"
          alt=""
        />
        Sync this {listType}
        {"'s"} questions to Slack
        {showInstructions && (
          <>
            <br />
            {" (command copied!)"}
          </>
        )}
      </button>
      {showInstructions && (
        <div className="mt-2 bg-neutral-100 rounded-md p-4 relative max-w-lg">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setShowInstructions(false)}
          >
            <XMarkIcon className="w-6 h-6 text-neutral-500" />
          </button>
          <span className="font-semibold">
            Paste into a Slack channel to share these questions there - and any
            questions added in the future
          </span>
          <span className="block text-neutral-400 italic mt-2">
            Make sure <Link href="/for-slack">Fatebook for Slack</Link> is
            installed first
          </span>
        </div>
      )}
    </div>
  )
}
