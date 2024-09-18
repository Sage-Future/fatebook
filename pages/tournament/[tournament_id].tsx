import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { TournamentView } from "../../components/TournamentView"
import { TournamentAdminPanel } from "../../components/TournamentAdminPanel"
import { api } from "../../lib/web/trpc"
import { signInToFatebook, useUserId } from "../../lib/web/utils"

export default function TournamentPage() {
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

  const isAdmin =
    (userId && tournamentQ.data?.authorId === userId) ||
    (tournamentQ.data?.anyoneInListCanEdit &&
      tournamentQ.data?.userList?.users.find((u) => u.id === userId))

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={tournamentQ.data?.name || "Prediction tournament"} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {!userId && (
            <div className="text-center">
              <button
                className="button primary mx-auto"
                onClick={() => void signInToFatebook()}
              >
                Sign in to see all questions and add your own predictions
              </button>
            </div>
          )}
          {isAdmin && <TournamentAdminPanel tournamentId={tournamentId} />}
          {tournamentQ.data ? (
            <>
              <TournamentView tournamentId={tournamentQ.data?.id} />
            </>
          ) : (
            <h3 className="text-neutral-600">
              {tournamentQ.isLoading ? "Loading..." : ""}
            </h3>
          )}
        </div>
      </div>
    </div>
  )
}
