import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import { NextSeo } from "next-seo"
import Link from "next/link"
import { useRouter } from "next/router"
import { TournamentLeaderboard } from "../../../components/TournamentLeaderboard"
import { api } from "../../../lib/web/trpc"
import {
  getTournamentUrl,
  signInToFatebook,
  useUserId,
} from "../../../lib/web/utils"

export default function TournamentLeaderboardPage() {
  const userId = useUserId()
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.tournament_id &&
    (router.query.tournament_id as string).match(/(.*)--(.*)/)
  const tournamentId = parts
    ? parts[2]
    : (router.query.tournament_id as string) || ""

  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo
        title={
          tournamentQ.data?.name
            ? `${tournamentQ.data?.name} leaderboard`
            : "Prediction tournament leaderboard"
        }
      />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {tournamentQ.data && (
            <Link
              href={getTournamentUrl(tournamentQ.data, true)}
              className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-4"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-1" />
              Back to {tournamentQ.data.name}
            </Link>
          )}
          {!userId && !tournamentQ.data?.sharedPublicly && (
            <div className="text-center">
              <button
                className="button primary mx-auto"
                onClick={() => void signInToFatebook()}
              >
                Sign in to see this tournament&apos;s leaderboard
              </button>
            </div>
          )}
          {tournamentQ.error?.message === "UNAUTHORIZED" && (
            <div className="text-center">
              <p>You don&apos;t have access to this tournament</p>
            </div>
          )}
          {tournamentQ.error?.message === "NOT_FOUND" && (
            <div className="text-center">
              <p>Tournament not found</p>
            </div>
          )}
          {userId && tournamentQ.isLoading && (
            <p className="text-center text-neutral-400">Loading...</p>
          )}
          {tournamentQ.data && (
            <TournamentLeaderboard tournamentId={tournamentId} />
          )}
        </div>
      </div>
    </div>
  )
}
