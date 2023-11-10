import { PlusIcon } from "@heroicons/react/24/solid"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Predict } from "../components/Predict"
import { Questions } from "../components/Questions"
import { TrackRecord } from "../components/TrackRecord"
import { WhyForecastInfo } from '../components/WhyForecastInfo'
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { useRouter } from "next/router"

export default function HomePage() {
  const { status: sessionStatus } = useSession()
  const userId = useUserId()

  return (
    <div className="max-sm:flex-col gap-8 lg:gap-12 flex justify-center px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <div className="prose mx-auto lg:w-[650px]">
        {!userId && sessionStatus !== "loading" && <>
          <h3 className="text-neutral-600">Track your predictions, make better decisions</h3>
        </>}

        <Predict />
        <Questions />

        {
          sessionStatus !== "loading" && !userId && <WhyForecastInfo />
        }

      </div>
      <Sidebar />
    </div>
  )
}

function Sidebar() {
  const userId = useUserId()

  return (
    <div className="pt-28 lg:w-[320px] max-sm:hidden flex flex-col gap-12">
      {userId && <TrackRecord trackRecordUserId={userId} />}
      {userId && <Tournaments />}
    </div>
  )
}

function Tournaments() {
  const tournamentsQ = api.tournament.getAll.useQuery()
  const createTournament = api.tournament.create.useMutation()
  const router = useRouter()

  return (
    <div className="prose">
      <h2 className="flex flex-row gap-2 justify-between mr-3">
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
      {
        tournamentsQ.data?.map(tournament => (
          <span key={tournament.id} className="flex flex-col gap-2">
            <Link href={`/tournament/${tournament.id}`} className="btn btn-ghost">
              {tournament.name}
            </Link>
          </span>
        ))
      }
      {
        tournamentsQ.status !== 'loading' && tournamentsQ.data?.length === 0 && (
          <p className="text-sm text-neutral-500 mx-1 -mt-4">
            {"Create a tournament to share a list of questions and see a leaderboard of everyone's accuracy"}
          </p>
        )
      }
    </div>
  )
}