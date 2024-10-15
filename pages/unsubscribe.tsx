import clsx from "clsx"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { api, getClientBaseUrl } from "../lib/web/trpc"
import { webFeedbackUrl } from "../lib/web/utils"
import { NextSeo } from "next-seo"

export function getUnsubscribeUrl(
  userEmail?: string,
  useRelativePath?: boolean,
) {
  return `${getClientBaseUrl(
    useRelativePath,
  )}/unsubscribe?u=${encodeURIComponent(userEmail ?? "")}`
}

export default function UnsubscribePage() {
  const router = useRouter()
  const unsubscribe = api.unsubscribe.useMutation()
  const [email, setEmail] = useState<string>(
    (typeof router.query?.u === "string" && router.query?.u) || "",
  )
  const [isUnsubscribed, setIsUnsubscribed] = useState(false)

  useEffect(() => {
    if (typeof router.query?.u === "string" && router.query?.u) {
      setEmail(router.query?.u)
    }
  }, [router.query?.u])

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo noindex={true} nofollow={true} />
      <div className="prose mx-auto">
        <p>
          {isUnsubscribed
            ? "You have unsubscribed from Fatebook emails. Click below to resubscribe."
            : "Unsubscribe below to stop receiving emails from Fatebook."}
        </p>
        <div className="flex flex-col gap-4">
          <input
            placeholder="Your email"
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
              unsubscribe.mutate({
                userEmail: email,
                setUnsubscribed: !isUnsubscribed,
              })
              setIsUnsubscribed(!isUnsubscribed)
            }}
            className="btn btn-primary"
            disabled={!!unsubscribe.isLoading}
          >
            {isUnsubscribed ? "Resubscribe" : "Unsubscribe"}
          </button>
        </div>
        {unsubscribe.isSuccess && (
          <>
            <h3 className="text-neutral-600">
              {isUnsubscribed
                ? "You have been unsubscribed from all emails."
                : "You have been resubscribed to all emails."}
            </h3>
            <p>
              <a href={webFeedbackUrl}>Want to give us some feedback?</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
