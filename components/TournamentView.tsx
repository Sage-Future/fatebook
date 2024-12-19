import { PlusIcon } from "@heroicons/react/20/solid"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { generateRandomId } from "../lib/_utils_common"
import { api } from "../lib/web/trpc"
import { Questions } from "./Questions"
import { TabbedQuestionSuggestions } from "./TabbedQuestionSuggestions"
import { TournamentLeaderboard } from "./TournamentLeaderboard"
import { TournamentSettingsButton } from "./TournamentSettingsButton"
import { Predict } from "./predict-form/Predict"
import { Username } from "./ui/Username"

export function TournamentView({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id

  const tournamentQ = api.tournament.get.useQuery({ id: tournamentId })

  const isPredictYourYear = tournamentQ.data?.predictYourYear !== null

  const [teamMode, setTeamMode] = useState(false)
  const [questionDrafts, setQuestionDrafts] = useState<
    { key: string; defaultTitle?: string }[]
  >([{ key: "default" }])

  useEffect(() => {
    if (router.query.team === "1") {
      setTeamMode(true)
    }
  }, [router.query.team])

  const year = tournamentQ.data?.predictYourYear ?? new Date().getFullYear()

  const isAdmin =
    (userId && tournamentQ.data?.authorId === userId) ||
    (tournamentQ.data?.anyoneInListCanEdit &&
      tournamentQ.data?.userList?.users.find((u) => u.id === userId))

  const utils = api.useContext()

  if (!isPredictYourYear) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="mt-0">{tournamentQ.data?.name}</h2>
        {tournamentQ.data?.description && (
          <p>{tournamentQ.data?.description}</p>
        )}
        <div>
          <span>Created by: </span>
          <Username
            user={tournamentQ.data?.author ?? null}
            className="bg-white px-2 py-1.5 rounded-full outline outline-1 outline-neutral-200 hover:bg-neutral-100"
          />
        </div>
        <Questions
          noQuestionsText="No questions in this tournament yet."
          filterTournamentId={tournamentId}
        />
        <TournamentLeaderboard tournamentId={tournamentId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {userId && tournamentQ.data && (
        <TournamentSettingsButton
          teamMode={teamMode}
          tournament={tournamentQ.data}
        />
      )}

      <Questions
        title={tournamentQ.data?.name}
        noQuestionsText=" "
        filterTournamentId={tournamentId}
        description={tournamentQ.data?.description || undefined}
      />

      <div className="flex flex-col gap-8">
        {isAdmin &&
          questionDrafts.map((draft) => (
            <div className="relative" key={draft.key}>
              <Predict
                questionDefaults={{
                  title: draft.defaultTitle,
                  tournamentId: tournamentId,
                  resolveBy: new Date(`${year + 1}-01-01`),
                  unlisted: tournamentQ.data?.unlisted,
                  sharePublicly: tournamentQ.data?.sharedPublicly,
                  shareWithListIds: tournamentQ.data?.userListId
                    ? [tournamentQ.data.userListId]
                    : [],
                }}
                onQuestionCreate={() => {
                  void utils.tournament.get.invalidate({ id: tournamentId })
                  void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate(
                    {
                      extraFilters: { filterTournamentId: tournamentId },
                    },
                  )
                  setQuestionDrafts((drafts) =>
                    drafts.filter((d) => d.key !== draft.key),
                  )
                }}
                resolveByButtons={[
                  { label: "3 months", date: new Date(`${year}-04-01`) },
                  { label: "6 months", date: new Date(`${year}-07-01`) },
                  { label: "9 months", date: new Date(`${year}-10-01`) },
                  { label: "End of year", date: new Date(`${year + 1}-01-01`) },
                ]}
                placeholder={`Will I move house in ${year}?`}
                showQuestionSuggestionsButton={false}
                small={true}
                smartSetDates={false}
              />
            </div>
          ))}
        {isAdmin && (
          <div className="flex justify-center">
            <button
              className="btn btn-circle py-2.5 -mt-2"
              onClick={() =>
                setQuestionDrafts((drafts) => [
                  ...drafts,
                  { key: generateRandomId(), defaultTitle: "" },
                ])
              }
            >
              <PlusIcon className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <TabbedQuestionSuggestions
        teamMode={teamMode}
        setTeamMode={setTeamMode}
        year={year}
        setQuestionDrafts={(drafts) => isAdmin && setQuestionDrafts(drafts)}
      />

      {tournamentQ.data?.showLeaderboard && (
        <div className="overflow-x-auto max-w-[90vw]">
          <TournamentLeaderboard tournamentId={tournamentId} />
        </div>
      )}
    </div>
  )
}
