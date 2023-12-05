import { CheckCircleIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon as CheckOutlineIcon } from '@heroicons/react/24/outline'
import { UserList } from "@prisma/client"
import clsx from 'clsx'
import { api } from "../lib/web/trpc"
import { invalidateQuestion, useUserId } from '../lib/web/utils'
import { QuestionWithStandardIncludes } from "../prisma/additional"
import { UserListDisplay } from './UserListDisplay'

export function UserListDropdown({
  question
} : {
  question: QuestionWithStandardIncludes
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const createList = api.userList.createList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
    }
  })
  const userListsQ = api.userList.getUserLists.useQuery()
  const setQuestionLists = api.userList.setQuestionLists.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    }
  })

  if (userId !== question.userId) {
    return <label className="text-sm">
      <span className="font-semibold">Shared with user lists: </span> {question.sharedWithLists?.map(list => list.name).join(", ") || "None"}
    </label>
  }

  return (
    <div className="dropdown max-sm:dropdown-end not-prose">
      <label tabIndex={0} className="btn flex gap-0">
        {question.sharedWithLists?.length > 0 ? `Shared with ${question.sharedWithLists.length} lists` : "Share with lists"}
        <ChevronDownIcon
          className="ml-2 -mr-2 h-5 w-5 text-neutral-400"
          aria-hidden="true"
        />
      </label>
      <ul tabIndex={0} className="dropdown-content menu shadow-2xl bg-base-100 rounded-box w-full md:w-[27rem]">
        {(userListsQ.data) ?
          userListsQ.data.map(userList => {
            const currentLists = question.sharedWithLists.map(l => l.id)
            const isInCurrentLists = currentLists.find(id => id === userList.id)
            return (
              <li
                key={(userList as UserList).id}
                className={clsx(
                  isInCurrentLists ? "bg-neutral-100 rounded-md" : "text-black",
                )}
                onClick={() => setQuestionLists.mutate({
                  questionId: question.id,
                  // toggle inclusion in list
                  listIds: isInCurrentLists ?
                    currentLists.filter(id => id !== userList.id) :
                    [...currentLists, userList.id]
                })}
              ><a className="active:bg-neutral-200">
                  {isInCurrentLists ?
                    <CheckCircleIcon className='shrink-0 fill-indigo-700' height={16} />
                    :
                    <CheckOutlineIcon className="shrink-0 stroke-neutral-400" height={16} />}
                  <UserListDisplay userList={userList} />
                </a></li>
            )
          })
          :
          <li className='px-6 italic'>
            {userListsQ.isSuccess ? "Loading..." : "Create a named list of people who you want to share multiple questions with"}
          </li>
        }
        <li>
          <a onClick={() => createList.mutate({ name: "New list" })}>
            <PlusIcon height={15} /> Create a new list
          </a>
        </li>
      </ul>
    </div>
  )
}
