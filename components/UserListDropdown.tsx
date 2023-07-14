import { CheckCircleIcon, CheckIcon, ChevronDownIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon as CheckOutlineIcon } from '@heroicons/react/24/outline'
import { UserList } from "@prisma/client"
import clsx from 'clsx'
import { useState } from 'react'
import { ReactMultiEmail } from 'react-multi-email'
import { api } from "../lib/web/trpc"
import { invalidateQuestion, useUserId } from '../lib/web/utils'
import { QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments, UserListWithAuthorAndUsers } from "../prisma/additional"

export function UserListDropdown({
  question
} : {
  question: QuestionWithUserAndForecastsWithUserAndSharedWithAndMessagesAndComments
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
      <ul tabIndex={0} className="dropdown-content menu shadow-2xl bg-base-100 rounded-box w-full md:w-96">
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
              ><a className="active:bg-neutral-400">
                  {isInCurrentLists ?
                    <CheckCircleIcon className='fill-indigo-700' height={16} />
                    :
                    <CheckOutlineIcon className="stroke-neutral-400" height={16} />}
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

function UserListDisplay({
  userList
}: {
  userList: UserListWithAuthorAndUsers
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const updateList = api.userList.updateList.useMutation({
    async onSettled() {
      await utils.userList.getUserLists.invalidate()
    }
  })
  const [isEditing, setIsEditing] = useState(false)
  const deleteList = api.userList.deleteList.useMutation({
    async onSettled() {
      await utils.userList.getUserLists.invalidate()
    }
  })

  return (
    <div
      className={clsx('flex flex-col gap-4',
                      isEditing && "gap-2"
      )}>
      <span className="flex gap-2 justify-between">
        <input
          type='text'
          disabled={!isEditing || updateList.isLoading}
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            "w-28 md:w-52 p-1",
            isEditing ? "border border-neutral-400 rounded-md" : "border-none",
            updateList.isLoading ? "opacity-50" : "opacity-100"
          )}
          autoFocus={true}
          defaultValue={userList.name}
          onBlur={(e) => {
            updateList.mutate({
              listId: userList.id,
              name: e.target.value
            })
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateList.mutate({
                listId: userList.id,
                name: e.currentTarget.value
              })
            }
          }}
        />
        <div className="flex gap-2">
          <button
            className={clsx("btn btn-circle btn-xs",
                            isEditing ? "btn-primary" : "btn-ghost"
            )}
            onClick={(e) => {setIsEditing(!isEditing); e.stopPropagation()}}
            disabled={userList.authorId !== userId}
          >
            {isEditing ?  <CheckIcon height={15} /> : <PencilIcon height={15} />}
          </button>
          <button
            className="btn btn-ghost btn-circle btn-xs"
            onClick={() => confirm(`Are you sure you want to delete '${userList.name}'?`) && deleteList.mutate({listId: userList.id})}
            disabled={userList.authorId !== userId || isEditing}
          >
            <TrashIcon height={15} />
          </button>
        </div>
      </span>
      {isEditing && <EmailInput userList={userList} />}
    </div>
  )
}

function EmailInput({
  userList
}: {
  userList: UserListWithAuthorAndUsers
}) {
  const [emails, setEmails] = useState<string[]>(userList.users.map((user) => user.email))
  const utils = api.useContext()
  const updateList = api.userList.updateList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
    }
  })

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <label className="block text-sm font-medium text-neutral-700">
        List members
      </label>
      <ReactMultiEmail
        className={clsx("text-sm w-44 md:w-80", updateList.isLoading && "opacity-50")}
        placeholder="alice@gmail.com..."
        delimiter=" "
        emails={emails}
        onChange={(emails: string[]) => {
          setEmails(emails)
        }}
        onBlur={() => {
          updateList.mutate({
            listId: userList.id,
            userEmails: emails,
          })
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateList.mutate({
              listId: userList.id,
              userEmails: emails,
            })
          }
        }}
        getLabel={(email, index, removeEmail) => {
          return (
            <div data-tag key={index}>
              <div data-tag-item>{email}</div>
              <span data-tag-handle onClick={() => removeEmail(index)}>
                ×
              </span>
            </div>
          )
        }}
      />
    </span>
  )
}