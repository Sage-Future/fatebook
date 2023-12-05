import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { Questions } from '../../components/Questions'
import { UserListDisplay } from '../../components/UserListDisplay'
import { Username } from '../../components/Username'
import { api } from '../../lib/web/trpc'
import { signInToFatebook, useUserId } from '../../lib/web/utils'

export default function ListPage() {
  const userId = useUserId()
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.list_id && (router.query.list_id as string).match(/(.*)--(.*)/)
  const listId = parts ? parts[2] : (router.query.list_id as string) || ""

  const listQ = api.userList.get.useQuery({
    id: listId,
  }, {
    retry: false,
  })

  // const isAdmin = listQ.data?.authorId === userId

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={listQ.data?.name || "User List"} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {
            !userId && <div className='text-center'>
              <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
                Sign in to see all questions and add your own predictions
              </button>
            </div>
          }
          {
            !listQ.data && <div className='text-center'>
              <h3 className="text-neutral-600">{listQ.isLoading ?
                "Loading..."
                :
                (userId ? "This list doesn't exist or you're not a member" : "")}</h3>
            </div>
          }
          {
            listQ.data ?
              <>
                <UserListDisplay bigHeading={true} userList={listQ.data} onDelete={() => void router.push("/")} />
                <p>
                  A user list created by <Username user={listQ.data.author} />
                </p>
                <p>
                  List members: {listQ.data.users.map(u => <Username key={u.id} user={u} className='ml-2' />)}
                </p>
                <Questions
                  title={"Your list's questions"}
                  noQuestionsText='No questions in this list yet.'
                  filterUserListId={listId}
                />
              </>
              :
              <h3 className="text-neutral-600">{listQ.isLoading ? "Loading..." : ""}</h3>
          }
        </div>
      </div>
    </div>
  )
}