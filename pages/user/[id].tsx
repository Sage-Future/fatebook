import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { Questions } from '../../components/Questions'
import { api } from '../../lib/web/trpc'

export default function UserPage() {
  const theirUserId = useUserPageId()
  const theirUserInfoQ = api.getUserInfo.useQuery({userId: theirUserId})

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
        <NextSeo title={`${theirUserInfoQ.data?.name || "User"}'s predictions`} />
        <div className="prose mx-auto lg:w-[650px]">
          <Questions
            theirUserId={theirUserId}
            title={<>
              {theirUserInfoQ?.data ? theirUserInfoQ?.data?.name + "'s public predictions" : "Loading..."}
            </>}
            noQuestionsText='No publicly shared predictions yet.'
          />
        </div>
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