import { PlusIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import { useRouter } from "next/router"
import { api } from "../lib/web/trpc"

export function Tournaments() {
  const tournamentsQ = api.tournament.getAll.useQuery()
  const createTournament = api.tournament.create.useMutation()
  const router = useRouter()

  return (
    <div className="prose">
      <h2 className="flex flex-row gap-2 justify-between mr-3 my-0">
        <span>
          Tournaments
          <span className="text-sm uppercase text-indigo-500 ml-2">New</span>
        </span>
        <button
          className="btn btn-ghost"
          onClick={() => {
            void (async () => {
              const tournament = await createTournament.mutateAsync()
              void router.push(`/tournament/${tournament.id}`)
            })()
          }}
          disabled={createTournament.isLoading}
        >
          <PlusIcon width={16} height={16} />
        </button>
      </h2>
      {tournamentsQ.data?.map(tournament => (
        <span key={tournament.id} className="flex flex-col gap-2">
          <Link href={`/tournament/${tournament.id}`} className="btn btn-ghost flex justify-start">
            {tournament.name}
          </Link>
        </span>
      ))}
      {tournamentsQ.status !== 'loading' && tournamentsQ.data?.length === 0 && (
        <p className="text-sm text-neutral-500 mx-1">
          {"Create a tournament to share a list of questions and see a leaderboard of everyone's accuracy"}
        </p>
      )}
    </div>
  )
}
