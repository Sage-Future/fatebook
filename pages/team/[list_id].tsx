import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { Questions } from "../../components/Questions"
import { SyncToSlack } from "../../components/SyncToSlack"
import { UserListDisplay } from "../../components/UserListDisplay"
import { Username } from "../../components/Username"
import { api } from "../../lib/web/trpc"
import {
  getUserListUrl,
  signInToFatebook,
  useUserId,
} from "../../lib/web/utils"

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
          {listQ.data ? (
            <div className="flex flex-col gap-2">
              <UserListDisplay
                bigHeading={true}
                userList={listQ.data}
                onDelete={() => void router.push("/")}
              />
              <span className="block">
                A team created by <Username user={listQ.data.author} />
              </span>
              <span className="block">
                Team members{" "}
                {listQ.data.users.length > 0 ? (
                  listQ.data.users.map((u) => (
                    <Username key={u.id} user={u} className="ml-2" />
                  ))
                ) : (
                  <span className="italic">none</span>
                )}
              </span>
              <span className="block">
                Email domains{" "}
                {listQ.data.emailDomains.length > 0 ? (
                  listQ.data.emailDomains.join(", ")
                ) : (
                  <span className="italic">none</span>
                )}
              </span>
              {userId && listQ.data.authorId === userId && (
                <SyncToSlack
                  listType="team"
                  url={getUserListUrl(listQ.data, false)}
                  entity={listQ.data}
                />
              )}
              <Questions
                title={"Your team's questions"}
                noQuestionsText="No questions shared with this team yet."
                filterUserListId={listId}
              />
            </div>
          ) : (
            <h3 className="text-neutral-600">
              {listQ.isLoading ? "Loading..." : ""}
            </h3>
          )}
        </div>
      </div>
    </div>
  )
}
