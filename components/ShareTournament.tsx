import { CheckCircleIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon as CheckOutlineIcon } from '@heroicons/react/24/outline'
import { Tournament, UserList } from '@prisma/client'
import clsx from 'clsx'
import Link from 'next/link'
import { api } from '../lib/web/trpc'
import { useUserId } from '../lib/web/utils'
import { CopyToClipboard } from './CopyToClipboard'
import { UserListDisplay } from './UserListDisplay'
export function ShareTournament({
  tournamentId,
}: {
  tournamentId: string
}) {
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })
  const updateTournament = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.tournament.get.invalidate()
      void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })

  const utils = api.useContext()
  const handleUpdate = ({tournament, questions}: {tournament: Partial<Tournament>, questions?: string[]}) => {
    console.log({tournament})
    if (tournamentQ.data) {
      updateTournament.mutate({
        tournament: {
          id: tournamentQ.data.id,
          ...tournament,
          questions: questions,
        }
      })
    }
  }

  if (!tournamentQ.data) {
    return <></>
  }

  return <>
    <div className="form-control flex-row items-center gap-2">
      <input
        id="sharedPublicly"
        type="checkbox"
        className="checkbox"
        checked={tournamentQ.data?.sharedPublicly}
        onChange={(e) => handleUpdate({tournament: {sharedPublicly: e.target.checked}})}
      />
      <label className="label" htmlFor="sharedPublicly">
        <span className="label-text">Anyone with the link can view this tournament page</span>
      </label>
      {tournamentQ.data?.sharedPublicly && <CopyToClipboard textToCopy={`${window.location.origin}/tournament/${tournamentQ.data?.id}`} />}
    </div>
    {tournamentQ.data?.sharedPublicly && <div className="form-control flex-row items-center gap-2">
      <input
        id="unlisted"
        type="checkbox"
        className="checkbox"
        checked={!tournamentQ.data?.unlisted}
        onChange={(e) => handleUpdate({tournament: {unlisted: !e.target.checked}})}
      />
      <label className="label" htmlFor="unlisted">
        <span className="label-text">{"Show in the public list of tournaments (coming soon!)"}</span>
      </label>
    </div>}
    <UserListSelect tournamentId={tournamentId} />
    <div className="form-control flex-row items-center gap-2">
      <input
        id="showLeaderboard"
        type="checkbox"
        className="checkbox"
        checked={tournamentQ.data?.showLeaderboard}
        onChange={(e) => handleUpdate({tournament: {showLeaderboard: e.target.checked}})}
      />
      <label className="label" htmlFor="showLeaderboard">
        <span className="label-text">Show leaderboard</span>
      </label>
    </div>
  </>
}

function UserListSelect({
  tournamentId
} : {
  tournamentId: string
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })
  const selectedUserList = tournamentQ.data?.userList

  const createList = api.userList.createList.useMutation({
    async onSuccess() {
      await utils.userList.getUserLists.invalidate()
    }
  })
  const userListsQ = api.userList.getUserLists.useQuery()
  const updateTournament = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.tournament.get.invalidate()
      void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })

  const handleUpdate = ({tournament, questions}: {tournament: Partial<Tournament>, questions?: string[]}) => {
    console.log({tournament})
    if (tournamentQ.data) {
      updateTournament.mutate({
        tournament: {
          id: tournamentQ.data.id,
          ...tournament,
          questions: questions,
        }
      })
    }
  }

  if (userId !== tournamentQ.data?.authorId) {
    return <label className="text-sm">
      <span className="font-semibold">Shared with user list: </span> {selectedUserList ?
        <Link key={selectedUserList.id} href={`list/${selectedUserList.id}`} onClick={(e) => e.stopPropagation()} className="ml-1">{selectedUserList.name}</Link>
      : "None"}
    </label>
  }

  return (
    <div className="dropdown max-sm:dropdown-end not-prose">
      <label tabIndex={0} className="btn flex gap-0">
        {selectedUserList ? `Shared with ${selectedUserList.name}` : "Share with a list of users"}
        <ChevronDownIcon
          className="ml-2 -mr-2 h-5 w-5 text-neutral-400"
          aria-hidden="true"
        />
      </label>
      <ul tabIndex={0} className="dropdown-content z-20 menu shadow-2xl bg-base-100 rounded-box w-full md:w-[27rem]">
        {(userListsQ.data) ?
          userListsQ.data.map(userList => {
            const selected = selectedUserList?.id === userList.id
            return (
              <li
                key={(userList as UserList).id}
                className={clsx(
                  selected ? "bg-neutral-100 rounded-md" : "text-black",
                )}
                onClick={() => handleUpdate({
                  tournament: {
                    userListId: selected ? null : userList.id
                  }
                })}
              ><a className="active:bg-neutral-200">
                  {selected ?
                    <CheckCircleIcon className='shrink-0 fill-indigo-700' height={16} />
                    :
                    <CheckOutlineIcon className="shrink-0 stroke-neutral-400" height={16} />}
                  <UserListDisplay userList={userList} />
                </a></li>
            )
          })
          :
          <li className='px-6 italic'>
            {userListsQ.isSuccess ? "Loading..." : "Create a named list of people who you want to share multiple tournaments with"}
          </li>
        }
        <li>
          <a onClick={() => createList.mutate({ name: "New list" })}>
            <PlusIcon height={15} /> Create a new list (e.g. for your team, friends, or class)
          </a>
        </li>
      </ul>
    </div>
  )
}