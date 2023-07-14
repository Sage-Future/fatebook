import clsx from 'clsx'
import { useRouter } from "next/router"
import { useEffect, useState } from 'react'
import { api, getClientBaseUrl } from "../lib/web/trpc"
import { webFeedbackUrl } from '../lib/web/utils'

export function getUnsubscribeUrl(userEmail?: string, useRelativePath?: boolean) {
  return `${getClientBaseUrl(useRelativePath)}/unsubscribe?u=${encodeURIComponent(userEmail ?? "")}`
}

export default function UnsubscribePage() {
  const router = useRouter()
  const unsubscribe = api.unsubscribe.useMutation()

  const [email, setEmail] = useState<string>((typeof router.query?.u === "string" && router.query?.u) || "")

  useEffect(() => {
    if (typeof router.query?.u === "string" && router.query?.u) {
      setEmail(router.query?.u)
    }
  }, [router.query?.u])

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto">
        <p>
          Unsubscribe below to stop receiving emails from Fatebook.
        </p>
        {unsubscribe.isSuccess ?
          <>
            <h3 className="text-neutral-600">You have been unsubscribed from all emails.</h3>
            <p><a href={webFeedbackUrl}>Want to give us some feedback?</a></p>
          </>
          :
          <div className='flex flex-col gap-4'>
            <input
              placeholder='Your email'
              disabled={unsubscribe.isLoading}
              className={clsx(
                "text-md border-2 border-neutral-300 rounded-md p-2 resize-none focus:outline-indigo-700",
              )}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={(e) => {
                e.preventDefault()
                if (!email) return
                unsubscribe.mutate({userEmail: email})
              }}
              className="btn btn-primary"
              disabled={!!unsubscribe.isLoading}
            >
              Unsubscribe
            </button>
          </div>}
      </div>
    </div>
  )
}