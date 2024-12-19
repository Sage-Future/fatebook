import { Popover } from "@headlessui/react"
import {
  CheckCircleIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/20/solid"
import { CheckCircleIcon as CheckOutlineIcon } from "@heroicons/react/24/outline"
import { Tournament, UserList } from "@prisma/client"
import clsx from "clsx"
import Link from "next/link"
import { api } from "../lib/web/trpc"
import { getTournamentUrl, getUserListUrl, useUserId } from "../lib/web/utils"
import { FixTournamentQuestionSharing } from "./FixTournamentQuestionSharing"
import { SyncToSlack } from "./SyncToSlack"
import { UserListDisplay } from "./UserListDisplay"
import { CopyToClipboard } from "./ui/CopyToClipboard"
export function ShareTournament({ tournamentId }: { tournamentId: string }) {
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })
  const updateTournament = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.tournament.get.invalidate()
      void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    },
  })

  const utils = api.useContext()
  const handleUpdate = ({
    tournament,
    questions,
  }: {
    tournament: Partial<Tournament>
    questions?: string[]
  }) => {
    if (tournamentQ.data && isAdmin) {
      updateTournament.mutate({
        tournament: {
          id: tournamentQ.data.id,
          ...tournament,
          questions: questions,
        },
      })
    }
  }

  const userId = useUserId()

  if (!tournamentQ.data) {
    return <></>
  }

  const isAdmin =
    (userId && tournamentQ.data?.authorId === userId) ||
    (tournamentQ.data.anyoneInListCanEdit &&
      tournamentQ.data.userList?.users.find((u) => u.id === userId))

  return (
    <div className="flex flex-col gap-4">
      <UserListSelect tournamentId={tournamentId} />
      <div className="form-control flex-row items-center gap-2">
        <input
          id="anyoneInListCanEdit"
          type="checkbox"
          className="checkbox"
          checked={tournamentQ.data?.anyoneInListCanEdit}
          onChange={(e) =>
            handleUpdate({
              tournament: { anyoneInListCanEdit: e.target.checked },
            })
          }
          disabled={
            !tournamentQ.data?.userListId ||
            userId !== tournamentQ.data?.authorId
          }
        />
        <label className="label" htmlFor="anyoneInListCanEdit">
          <span className="label-text">
            {"Anyone in the "}
            {tournamentQ.data?.userList ? (
              <Link href={getUserListUrl(tournamentQ.data.userList, true)}>
                {tournamentQ.data?.userList?.name}
              </Link>
            ) : (
              "selected"
            )}
            {" team can edit and add questions to this tournament"}
          </span>
        </label>
      </div>
      <div className="mt-4">
        {tournamentQ.data && (
          <SyncToSlack
            listType="tournament"
            url={getTournamentUrl(tournamentQ.data, false)}
            entity={tournamentQ.data}
          />
        )}
      </div>
      <div className="form-control flex-row items-center gap-2">
        <input
          id="sharedPublicly"
          type="checkbox"
          className="checkbox"
          checked={tournamentQ.data?.sharedPublicly}
          onChange={(e) =>
            handleUpdate({ tournament: { sharedPublicly: e.target.checked } })
          }
          disabled={!isAdmin}
        />
        <label className="label" htmlFor="sharedPublicly">
          <span className="label-text">
            Anyone with the link can view this tournament page
          </span>
        </label>
        {tournamentQ.data?.sharedPublicly && (
          <CopyToClipboard
            textToCopy={getTournamentUrl(tournamentQ.data, false)}
          />
        )}
      </div>
      <FixTournamentQuestionSharing tournament={tournamentQ.data} />
      {tournamentQ.data?.sharedPublicly && (
        <div className="form-control flex-row items-center gap-2">
          <input
            id="unlisted"
            type="checkbox"
            className="checkbox"
            checked={!tournamentQ.data?.unlisted}
            onChange={(e) =>
              handleUpdate({ tournament: { unlisted: !e.target.checked } })
            }
            disabled={!isAdmin}
          />
          <label className="label" htmlFor="unlisted">
            <span className="label-text">
              {tournamentQ.data?.predictYourYear ? (
                <span>
                  Show in the{" "}
                  <Link href="/predict-your-year" target="_blank">
                    {`public list of ${tournamentQ.data.predictYourYear} predictions`}
                  </Link>
                </span>
              ) : (
                "Show in the public list of tournaments (coming soon!)"
              )}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}

function UserListSelect({ tournamentId }: { tournamentId: string }) {
  const userId = useUserId()
  const utils = api.useContext()
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })
  const selectedUserList = tournamentQ.data?.userList

  const createList = api.userList.createList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
    },
  })
  const userListsQ = api.userList.getUserLists.useQuery()
  const updateTournament = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.tournament.get.invalidate()
      void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    },
  })

  const handleUpdate = ({
    tournament,
    questions,
  }: {
    tournament: Partial<Tournament>
    questions?: string[]
  }) => {
    if (tournamentQ.data) {
      updateTournament.mutate({
        tournament: {
          id: tournamentQ.data.id,
          ...tournament,
          questions: questions,
        },
      })
    }
  }

  if (userId !== tournamentQ.data?.authorId) {
    return (
      <label className="text-sm">
        <span className="font-semibold">Shared with team: </span>{" "}
        {selectedUserList ? (
          <Link
            key={selectedUserList.id}
            href={getUserListUrl(selectedUserList, true)}
            onClick={(e) => e.stopPropagation()}
            className="ml-1"
          >
            {selectedUserList.name}
          </Link>
        ) : (
          "None"
        )}
      </label>
    )
  }

  return (
    <Popover as="div" className="relative w-full">
      <Popover.Button className="btn text-sm flex gap-0">
        {selectedUserList
          ? `Shared with ${selectedUserList.name}`
          : "Share with a team"}
        <ChevronDownIcon
          className="ml-2 -mr-2 h-5 w-5 text-neutral-400"
          aria-hidden="true"
        />
      </Popover.Button>
      <Popover.Panel className="absolute z-50 w-full cursor-auto">
        <div className="absolute z-50 mt-2 w-72 md:w-96 lg:w-[29rem] right-0 md:left-0 origin-top-right p-2 flex flex-col gap-2 rounded-md bg-neutral-50 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
          {userListsQ.data ? (
            userListsQ.data.map((userList) => {
              const selected = selectedUserList?.id === userList.id
              return (
                <div
                  key={(userList as UserList).id}
                  className={clsx(
                    "flex flex-row gap-2 rounded-md shadow-sm p-2",
                    selected ? "bg-indigo-50 rounded-md" : "bg-white",
                  )}
                >
                  <button
                    className="btn btn-circle btn-ghost mb-auto grow-0"
                    onClick={() =>
                      handleUpdate({
                        tournament: {
                          userListId: selected ? null : userList.id,
                        },
                      })
                    }
                  >
                    {selected ? (
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
              {userListsQ.isSuccess ? "Loading..." : "Create a team"}
            </div>
          )}
          <button
            className="btn btn-ghost"
            onClick={() => createList.mutate({ name: "New team" })}
          >
            <PlusIcon height={15} /> Create a new team{" "}
            <span className="text-xs text-neutral-400">
              (e.g. for your team, friends, or class)
            </span>
          </button>
        </div>
      </Popover.Panel>
    </Popover>
  )
}
