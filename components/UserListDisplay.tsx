import { CheckIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { ReactMultiEmail } from 'react-multi-email'
import { api, getClientBaseUrl } from "../lib/web/trpc"
import { useUserId } from '../lib/web/utils'
import { UserListWithAuthorAndUsers } from "../prisma/additional"
import { CopyToClipboard } from './CopyToClipboard'
import { InfoButton } from './InfoButton'

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
      className={clsx('flex flex-col gap-2 grow',)}
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
              "border border-neutral-400 rounded-md focus:outline-indigo-700",
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
          <>
            <Link
              href={`/list/${userList.id}`}
              className={clsx(
                "p-1 my-auto no-underline hover:underline",
              )}
              target='_blank'
            >
              {bigHeading ?
                <h3 className="text-xl font-semibold my-0">{userList.name}</h3>
                :
                <>
                  {userList.name}
                  <ArrowTopRightOnSquareIcon className="inline ml-1 h-3 w-3 text-neutral-600" />

                  {(userList.users.length > 0 || userList.emailDomains.length === 0) && (
                    <span className="block text-xs my-auto font-normal text-neutral-400">
                      {userList.users.length} member{userList.users.length === 1 ? "" : "s"}
                    </span>
                  )}
                  {userList.emailDomains.length > 0 && (
                    <span className='block text-xs my-auto font-normal text-neutral-400'>
                      {userList.emailDomains.map(domain => `anyone@${domain}`).join(', ')}
                    </span>
                  )}
                </>
              }
            </Link>
          </>
        )}
        <div className="flex gap-2">
          {userList.authorId !== userId ? (
            <InfoButton
              tooltip={`You cannot edit this list because it was created by ${userList.author.name || "another user"}.`}
              className="btn btn-circle btn-xs btn-ghost"
              showInfoButton={false}
            >
              <button
                type="button"
                className={clsx("btn btn-circle btn-xs btn-ghost disabled:bg-white")}
                disabled={true}
              >
                <PencilIcon className='w-4 h-4' />
              </button>
            </InfoButton>
          ) : (
            <button
              type="button"
              className={clsx("btn btn-circle btn-xs",
                isEditing ? "btn-primary" : "btn-ghost"
              )}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (isEditing) {
                  setTimeout(() => setIsEditing(false), 500)
                } else {
                  setIsEditing(true)
                }
              }}
            >
              {isEditing ? <CheckIcon className='w-4 h-4' /> : <PencilIcon className='w-4 h-4' />}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-xs disabled:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              confirm(`Are you sure you want to delete '${userList.name}'?`) && deleteList.mutate({ listId: userList.id })
              onDelete && onDelete()
            }}
            disabled={userList.authorId !== userId || isEditing}
          >
            <TrashIcon className='w-4 h-4' />
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
        className={clsx("text-sm w-44 md:w-[22rem] placeholder:text-neutral-400", updateList.isLoading && "opacity-50")}
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

        <div className='mt-4'>
          <label className="text-sm font-medium text-neutral-700 mb-0.5 mt-6 w-full">
            Add <span className='text-neutral-500'>
              {(
                (userList.emailDomains.length > 0) ? userList.emailDomains : ["yourcompany.com"])
                .map((domain) => `everyone@${domain}`).join(" and ")}
            </span> to this list
          </label>
          <input
            type='text'
            disabled={updateList.isLoading}
            onClick={(e) => e.stopPropagation()}
            placeholder='yourcompany.com'
            className={clsx(
              "text-sm w-44 md:w-[22rem] p-2 block",
              "border rounded-md focus:outline-indigo-700 placeholder:text-neutral-400",
              updateList.isLoading ? "opacity-50" : "opacity-100"
            )}
            defaultValue={userList.emailDomains.join(' ')}
            onBlur={(e) => {
              const domains = e.target.value.split(' ').filter(
                (domain) => {
                  return new RegExp('^(?!-)[A-Za-z0-9-]+([.-][A-Za-z0-9]+)*.[A-Za-z]{2,6}$').test(domain)
                }
              )
              if (domains.length === 0 && e.target.value) {
                toast.error("Please enter a valid domain, e.g. mycompany.com")
              } else {
                updateList.mutate({
                  listId: userList.id,
                  emailDomains: domains || null
                })
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const domains = e.currentTarget.value.split(' ').filter(
                  (domain) => {
                    return new RegExp('^(?!-)[A-Za-z0-9-]+([.-][A-Za-z0-9]+)*.[A-Za-z]{2,6}$').test(domain)
                  }
                )
                if (domains.length === 0 && e.currentTarget.value) {
                  toast.error("Please enter a valid domain, e.g. mycompany.com")
                } else {
                  updateList.mutate({
                    listId: userList.id,
                    emailDomains: domains || null
                  })
                }
              }
            }} />
        </div>
    </span>
  )
}
