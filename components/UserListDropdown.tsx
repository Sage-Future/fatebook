import { Popover } from "@headlessui/react"
import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/20/solid"
import { CheckCircleIcon as CheckOutlineIcon } from "@heroicons/react/24/outline"
import { UserList } from "@prisma/client"
import clsx from "clsx"
import Link from "next/link"
import { api } from "../lib/web/trpc"
import {
  getUserListUrl,
  ifEmpty,
  invalidateQuestion,
  useUserId,
} from "../lib/web/utils"
import { QuestionWithStandardIncludes } from "../prisma/additional"
import { UserListDisplay } from "./UserListDisplay"

export function UserListDropdown({
  question,
}: {
  question: QuestionWithStandardIncludes
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const createList = api.userList.createList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
    },
  })
  const userListsQ = api.userList.getUserLists.useQuery()
  const setQuestionLists = api.userList.setQuestionLists.useMutation({
    async onSuccess() {
      await invalidateQuestion(utils, question)
    },
  })

  if (userId !== question.userId) {
    return (
      <label className="text-sm">
        <span className="font-semibold">Shared with teams: </span>{" "}
        {ifEmpty(
          question.sharedWithLists?.map((list) => (
            <Link
              key={list.id}
              href={getUserListUrl(list, true)}
              onClick={(e) => e.stopPropagation()}
              className="ml-1"
            >
              {list.name}
            </Link>
          )),
          "None",
        ) || "None"}
      </label>
    )
  }

  return (
    <Popover as="div" className="relative w-full">
      <Popover.Button className="btn text-sm flex gap-0">
        {question.sharedWithLists?.length > 0
          ? `Shared with ${question.sharedWithLists
              .map((list) => list.name)
              .join(", ")}`
          : "Share with teams"}
        <ChevronDownIcon
          className="ml-2 -mr-2 h-5 w-5 text-neutral-400"
          aria-hidden="true"
        />
      </Popover.Button>
      <Popover.Panel className="absolute z-50 w-full cursor-auto">
        <div className="absolute z-50 mt-2 w-72 md:w-96 lg:w-[29rem] right-0 md:left-0 origin-top-right p-2 flex flex-col gap-2 rounded-md bg-neutral-50 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
          {userListsQ.data ? (
            userListsQ.data
              .sort((a, b) => {
                if (a.id < b.id) return -1
                if (a.id > b.id) return 1
                return a.name.localeCompare(b.name)
              })
              .map((userList) => {
                const currentLists = question.sharedWithLists.map((l) => l.id)
                const isInCurrentLists = currentLists.find(
                  (id) => id === userList.id,
                )
                return (
                  <div
                    key={(userList as UserList).id}
                    className={clsx(
                      "flex flex-row gap-2 rounded-md shadow-sm p-2",
                      isInCurrentLists ? "bg-indigo-50 rounded-md" : "bg-white",
                    )}
                  >
                    <button
                      className="btn btn-circle btn-ghost mb-auto grow-0"
                      onClick={() =>
                        setQuestionLists.mutate({
                          questionId: question.id,
                          // toggle inclusion in list
                          listIds: isInCurrentLists
                            ? currentLists.filter((id) => id !== userList.id)
                            : [...currentLists, userList.id],
                        })
                      }
                    >
                      {isInCurrentLists ? (
                        <CheckCircleIcon className="shrink-0 fill-indigo-700 w-6 h-6" />
                      ) : (
                        <CheckOutlineIcon className="shrink-0 stroke-neutral-400 w-6 h-6" />
                      )}
                    </button>
                    <UserListDisplay userList={userList} />
                  </div>
                )
              })
          ) : (
            <div className="px-6 italic">
              {userListsQ.isSuccess
                ? "Loading..."
                : "Create a team of people who you want to share multiple questions with"}
            </div>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => createList.mutate({ name: "New team" })}
          >
            <PlusIcon height={15} /> Create a new team
          </button>
        </div>
      </Popover.Panel>
    </Popover>
  )
}
