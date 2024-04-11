import { XMarkIcon } from "@heroicons/react/20/solid"
import { User } from "@prisma/client"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import React, { ReactNode, useState } from "react"
import ReactSelect, { ActionMeta, SingleValue } from "react-select"
import { logAndReturn } from "../../lib/_utils_common"
import { api } from "../../lib/web/trpc"
import { getUserPageUrl } from "../../pages/user/[id]"

export function MultiselectUsers({
  users,
  setEmails,
  isLoading,
  placeholder = "Share by email...",
}: {
  users: User[]
  setEmails: (emails: string[]) => void
  isLoading: boolean
  placeholder?: string
}) {
  return (
    <div
      className={clsx("text-sm flex flex-col gap-2", isLoading && "opacity-80")}
    >
      <EmailInput
        submitEmail={(email) => {
          setEmails([...users.map((u) => u.email), email])
        }}
        hideSuggestedEmails={users.map((u) => u.email)}
        placeholder={placeholder}
      />
      {users.length > 0 && (
        <div className="flex flex-col gap-4 bg-neutral-50 rounded-md p-2 mx-2 max-h-[350px] overflow-y-auto showScrollbar">
          {users.map((user) => (
            <div
              key={user.email}
              className="flex justify-between items-center w-full"
            >
              <UsernameWithEmail user={user} link={true} />
              <button
                className="btn btn-xs btn-circle btn-ghost"
                disabled={isLoading}
                onClick={() =>
                  setEmails(
                    logAndReturn(
                      users
                        .map((u) => u.email)
                        .filter((email) => email !== user.email),
                    ),
                  )
                }
              >
                <XMarkIcon className="w-4 h-4 shrink-0" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface UserOption {
  value: string
  label: ReactNode
}

function EmailInput({
  submitEmail,
  hideSuggestedEmails,
  placeholder,
}: {
  submitEmail: (email: string) => void
  hideSuggestedEmails: string[]
  placeholder?: string
}) {
  const getShareSuggestionsQ = api.question.getShareSuggestions.useQuery()
  const [inputValue, setInputValue] = useState<string>("")

  const options: UserOption[] =
    getShareSuggestionsQ.data
      ?.filter((u) => !!u && !hideSuggestedEmails.includes(u.email))
      .map((user) => ({
        value: user!.email,
        label: (
          <div className="flex flex-col gap-1">
            <UsernameWithEmail user={user!} />
          </div>
        ),
      })) || []

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  return (
    <ReactSelect
      options={options}
      onInputChange={(newValue: string) => setInputValue(newValue)}
      onChange={(
        newValue: SingleValue<UserOption>,
        actionMeta: ActionMeta<UserOption>,
      ) => {
        if (
          actionMeta.action === "select-option" &&
          newValue &&
          isValidEmail(newValue.value)
        )
          submitEmail(newValue.value)
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" && inputValue && isValidEmail(inputValue))
          submitEmail(inputValue)
      }}
      placeholder={placeholder}
      noOptionsMessage={() => null}
      inputValue={inputValue}
      value={null}
      controlShouldRenderValue={false}
      isLoading={getShareSuggestionsQ.status === "loading"}
      theme={(theme) => ({
        ...theme,
        borderRadius: 8,
        colors: {
          ...theme.colors,
          primary25: "#e0e7ff",
          primary: "#4338ca",
        },
      })}
      components={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        DropdownIndicator: () => null,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        IndicatorSeparator: () => null,
      }}
    />
  )
}

function UsernameWithEmail({ user, link }: { user: User; link?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src={user?.image || "/default_avatar.png"}
        width={20}
        height={20}
        className="rounded-full select-none aspect-square shrink-0 my-0"
        alt=""
      />
      <div>
        {user.name ? (
          link ? (
            <Link
              href={getUserPageUrl(user)}
              className="block font-semibold text-black no-underline hover:underline"
            >
              {user.name}
            </Link>
          ) : (
            <span className="block font-semibold text-black">{user.name}</span>
          )
        ) : (
          <span className="block font-medium text-neutral-700 italic text-sm cursor-default">
            ✉️ Invited to Fatebook
          </span>
        )}
        <span className="block text-neutral-500 text-sm">{user.email}</span>
      </div>
    </div>
  )
}
