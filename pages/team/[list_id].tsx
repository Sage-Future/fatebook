import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { TeamListContent } from "../../components/TeamListContent"
import { api } from "../../lib/web/trpc"
import { signInToFatebook, useUserId } from "../../lib/web/utils"

export default function ListPage() {
  const userId = useUserId()
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.list_id && (router.query.list_id as string).match(/(.*)--(.*)/)
  const listId = parts ? parts[2] : (router.query.list_id as string) || ""

  const listQ = api.userList.get.useQuery(
    {
      id: listId,
    },
    {
      retry: false,
    },
  )

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={listQ.data?.name || "Team"} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {!userId && (
            <div className="text-center">
              <button
                className="button primary mx-auto"
                onClick={() => void signInToFatebook()}
              >
                Sign in to see all questions and add your own predictions
              </button>
            </div>
          )}
          {!listQ.data && (
            <div className="text-center">
              <h3 className="text-neutral-600">
                {listQ.isLoading
                  ? "Loading..."
                  : userId
                    ? "This team doesn't exist or you're not a member"
                    : ""}
              </h3>
            </div>
          )}
          {listQ.data && userId && (
            <TeamListContent userList={listQ.data} userId={userId} />
          )}
        </div>
      </div>
    </div>
  )
}
