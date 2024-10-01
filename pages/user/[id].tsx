import { User } from "@prisma/client"
import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { Questions } from "../../components/Questions"
import { TrackRecord } from "../../components/TrackRecord"
import { api } from "../../lib/web/trpc"

export default function UserPage() {
  const theirUserId = useUserPageId()
  const theirUserInfoQ = api.getUserInfo.useQuery({ userId: theirUserId })

  return (
    <div className="max-sm:flex-col-reverse gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title={`${theirUserInfoQ.data?.name || "User"}'s predictions`}
        noindex={true}
        nofollow={true}
      />
      <div className="prose mx-auto lg:w-[650px]">
        <Questions
          theirUserId={theirUserId}
          title={
            <>
              {theirUserInfoQ?.data
                ? theirUserInfoQ?.data?.name + "'s public predictions"
                : "Loading..."}
            </>
          }
          noQuestionsText="No publicly shared predictions yet."
        />
      </div>

      <div className="md:pt-28 flex flex-col gap-12 max-w-[320px]">
        <TrackRecord trackRecordUserId={theirUserId} />
      </div>
    </div>
  )
}

function useUserPageId() {
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.id && (router.query.id as string).match(/(.*)--(.*)/)
  return parts ? parts[2] : (router.query.id as string) || ""
}

export function getUserPageUrl(user: User) {
  return `/user/${encodeURIComponent(
    user?.name?.replace(" ", "-") || "",
  )}--${user?.id}`
}
