import { PlusIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/router"
import { api } from "../lib/web/trpc"
import { UserListDisplay } from "./UserListDisplay"
import { getUserListUrl } from "../lib/web/utils"

// Add new props
export function UserLists({ inCarousel, onItemClick }: { inCarousel?: boolean, onItemClick?: (id: string) => void }) {
  const userListsQ = api.userList.getUserLists.useQuery()
  const createUserList = api.userList.createList.useMutation()
  const router = useRouter()

  console.log('teams inCarousel', inCarousel);

  return (
    <div className="prose">
      <h2 className="flex flex-row gap-2 justify-between mr-3 my-0 select-none">
        <span>Teams</span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            void (async () => {
              const userList = await createUserList.mutateAsync({
                name: "New team",
              })
              void router.push(getUserListUrl(userList, true))
            })()
          }}
          disabled={createUserList.isLoading}
        >
          <PlusIcon width={16} height={16} />
        </button>
      </h2>
      <div className="mx-3.5">
        {userListsQ.data?.map((userList) => (
          inCarousel ? (
            <button
              key={userList.id}
              className="btn btn-ghost flex justify-start w-full p-0"
              onClick={() => onItemClick && onItemClick(userList.id)}
            >
              <UserListDisplay userList={userList} compact inCarousel={true} />
            </button>
          ) : (
            <UserListDisplay key={userList.id} userList={userList} compact />
          )
        ))}
      </div>
      {userListsQ.status !== "loading" && userListsQ.data?.length === 0 && (
        <p className="text-sm text-neutral-500 mx-1">
          {
            "Create a team to share questions with specific collaborators or email domains"
          }
        </p>
      )}
    </div>
  )
}
