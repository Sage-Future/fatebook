import { PlusIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/router"
import { api } from "../lib/web/trpc"
import { UserListDisplay } from './UserListDisplay'
import { getUserListUrl } from "../lib/web/utils"

export function UserLists() {
  const userListsQ = api.userList.getUserLists.useQuery()
  const createUserList = api.userList.createList.useMutation()
  const router = useRouter()

  return (
    <div className="prose">
      <h2 className="flex flex-row gap-2 justify-between mr-3 my-0 select-none">
        <span>
          Teams
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            void (async () => {
              const userList = await createUserList.mutateAsync({ name: 'New List' })
              void router.push(getUserListUrl(userList))
            })()
          }}
          disabled={createUserList.isLoading}
        >
          <PlusIcon width={16} height={16} />
        </button>
      </h2>
      <div className="mx-3.5">
        {userListsQ.data?.map(userList => (
          <UserListDisplay key={userList.id} userList={userList} compact />
        ))}
      </div>
      {userListsQ.status !== 'loading' && userListsQ.data?.length === 0 && (
        <p className="text-sm text-neutral-500 mx-1">
          {"Create a team to share questions with specific collaborators or email domains"}
        </p>
      )}
    </div>
  )
}
