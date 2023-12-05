import { CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'
import { useState } from 'react'
import { ReactMultiEmail } from 'react-multi-email'
import { api, getClientBaseUrl } from "../lib/web/trpc"
import { useUserId } from '../lib/web/utils'
import { UserListWithAuthorAndUsers } from "../prisma/additional"
import { CopyToClipboard } from './CopyToClipboard'

export function UserListDisplay({
  userList,
  bigHeading,
  onDelete,
}: {
  userList: UserListWithAuthorAndUsers
  bigHeading?: boolean
  onDelete?: () => void
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const updateList = api.userList.updateList.useMutation({
    async onSettled() {
      await utils.userList.getUserLists.invalidate()
      await utils.userList.get.invalidate()
    }
  })
  const [isEditing, setIsEditing] = useState(false)
  const deleteList = api.userList.deleteList.useMutation({
    async onSettled() {
      await utils.userList.getUserLists.invalidate()
      await utils.userList.get.invalidate()
    }
  })

  return (
    <div
      className={clsx('flex flex-col gap-4',
        isEditing && "gap-2",
        isEditing && "ml-4"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex gap-2 justify-between">
        {isEditing ? (
          <input
            type='text'
            disabled={updateList.isLoading}
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "w-28 md:w-60 p-1",
              "border border-neutral-400 rounded-md",
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
            }} />
        ) : (
          <Link
            href={`/list/${userList.id}`}
            className={clsx(
              "p-1 my-auto no-underline hover:underline",
            )}
          >
            {bigHeading ?
              <h3 className="text-xl font-semibold my-0">{userList.name}</h3>
              :
              <>
                {userList.name}
                <ArrowTopRightOnSquareIcon className="inline ml-1 h-3 w-3 text-neutral-600" />
              </>
            }
          </Link>
        )}
        <div className="flex gap-2">
          {<button
            className={clsx("btn btn-circle btn-xs",
              isEditing ? "btn-primary" : "btn-ghost"
            )}
            onClick={(e) => { setIsEditing(!isEditing); e.stopPropagation() }}
            disabled={userList.authorId !== userId}
          >
            {isEditing ? <CheckIcon height={15} /> : <PencilIcon height={15} />}
          </button>}
          <button
            className="btn btn-ghost btn-circle btn-xs"
            onClick={(e) => {
              e.stopPropagation()
              confirm(`Are you sure you want to delete '${userList.name}'?`) && deleteList.mutate({ listId: userList.id })
              onDelete && onDelete()
            }}
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
  userList: UserListWithAuthorAndUsers;
}) {
  const [emails, setEmails] = useState<string[]>(userList.users.map((user) => user.email))
  const utils = api.useContext()
  const updateList = api.userList.updateList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
      await utils.userList.get.invalidate()
      console.log("SUCCESS")
    }
  })

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <label className="flex justify-between align-bottom text-sm font-medium text-neutral-700 mb-0.5">
        <span className='my-auto'>
          List members
        </span>
        <CopyToClipboard textToCopy={`${getClientBaseUrl(false)}/list/join/${userList.inviteId}`} buttonLabel='Copy invite link' />
      </label>
      <ReactMultiEmail
        className={clsx("text-sm w-44 md:w-[22rem]", updateList.isLoading && "opacity-50")}
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
        }} />
    </span>
  )
}
