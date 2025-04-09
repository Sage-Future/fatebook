import { ArrowDownTrayIcon } from "@heroicons/react/24/outline"
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/24/solid"
import { Tournament } from "@prisma/client"
import clsx from "clsx"
import { useRouter } from "next/router"
import { useState } from "react"
import { api } from "../lib/web/trpc"
import { downloadBlob, useUserId } from "../lib/web/utils"
import { FixTournamentQuestionSharing } from "./FixTournamentQuestionSharing"
import { QuestionsMultiselect } from "./QuestionsMultiselect"
import { ShareTournament } from "./ShareTournament"
import { Predict } from "./predict-form/Predict"
import { InfoButton } from "./ui/InfoButton"
import { Username } from "./ui/Username"

export function TournamentAdminPanel({
  tournamentId,
  includeAddNewQuestion = true,
  includeShareTournament = true,
  collapsible = true,
}: {
  tournamentId: string
  includeAddNewQuestion?: boolean
  includeShareTournament?: boolean
  collapsible?: boolean
}) {
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })
  const updateTournament = api.tournament.update.useMutation({
    onSuccess: () => {
      void utils.tournament.get.invalidate()
      void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    },
  })
  const router = useRouter()
  const deleteTournament = api.tournament.delete.useMutation({
    onSuccess: () => {
      void router.push("/")
    },
  })

  const exportToCsv = api.tournament.exportToCsv.useMutation({
    onSuccess: (data) => {
      if (!data) {
        alert("Nothing to export")
        return
      }
      downloadBlob(data, `tournament-forecasts.csv`, "text/csv")
    },
  })

  const adminPanelCollapsedLocalStorageKey = `tournamentAdminCollapsed_${tournamentId}`
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem(adminPanelCollapsedLocalStorageKey) === "true",
  )

  const userId = useUserId()
  const utils = api.useContext()
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
          currentQuestions: tournamentQ.data.questions.map((q) => q.id),
        },
      })
    }
  }

  if (!tournamentQ.data) {
    return <></>
  }

  const isAdmin =
    (userId && tournamentQ.data?.authorId === userId) ||
    (tournamentQ.data.anyoneInListCanEdit &&
      tournamentQ.data.userList?.users.find((u) => u.id === userId))

  return (
    <form
      className={clsx(
        "space-y-4 bg-white py-4 px-6 mb-8 rounded-xl max-w-prose",
        collapsible && "shadow-md",
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="my-2">
          Tournament settings
          <InfoButton
            placement="bottom"
            tooltip={
              isAdmin
                ? tournamentQ?.data.anyoneInListCanEdit
                  ? `Anyone in the ${tournamentQ?.data?.userList?.name} team can view and change these settings.`
                  : "Only you can view and change these settings."
                : "You are not an admin of this tournament and cannot change these settings."
            }
            className="ml-2 font-normal tooltip-bottom"
          />
        </h3>
        {collapsible && (
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              setIsCollapsed(!isCollapsed)
              // persist across pageloads
              localStorage.setItem(
                adminPanelCollapsedLocalStorageKey,
                !isCollapsed ? "true" : "false",
              )
              e.preventDefault()
            }}
          >
            {isCollapsed ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-4">
          {!isAdmin && (
            <p className="text-neutral-400 text-sm">
              You are not an admin of this tournament and cannot change these
              settings. The tournament was created by{" "}
              {<Username user={tournamentQ.data.author} />}
            </p>
          )}
          <div className="form-control">
            <label className="label" htmlFor="tournamentName">
              <span className="label-text">Tournament name</span>
            </label>
            <input
              id="tournamentName"
              type="text"
              className="input input-bordered"
              placeholder="Tournament name"
              defaultValue={tournamentQ.data?.name}
              onBlur={(e) =>
                isAdmin &&
                handleUpdate({ tournament: { name: e.target.value } })
              }
              disabled={!isAdmin}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="tournamentDescription">
              <span className="label-text">Description</span>
              <InfoButton
                tooltip="Markdown formatting is supported"
                className="tooltip-left"
              />
            </label>
            <textarea
              id="tournamentDescription"
              className="textarea textarea-bordered"
              placeholder="Description (optional)"
              defaultValue={tournamentQ.data?.description || ""}
              onBlur={(e) =>
                isAdmin &&
                handleUpdate({
                  tournament: { description: e.target.value || null },
                })
              }
              disabled={!isAdmin}
            />
          </div>
          {includeAddNewQuestion && isAdmin && (
            <>
              <h4 className="label">Add questions to this tournament</h4>
              <Predict
                questionDefaults={{
                  tournamentId,
                  unlisted: tournamentQ.data?.unlisted,
                  sharePublicly: tournamentQ.data?.sharedPublicly,
                  shareWithListIds: tournamentQ.data?.userListId
                    ? [tournamentQ.data.userListId]
                    : undefined,
                }}
                onQuestionCreate={() => {
                  void utils.tournament.get.invalidate({ id: tournamentId })
                  void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate(
                    {
                      extraFilters: {
                        filterTournamentId: tournamentId,
                      },
                    },
                  )
                }}
                small={true}
              />
            </>
          )}
          <div className="form-control">
            <label className="label">
              <span className="label-text">
                Add existing questions to the tournament
              </span>
            </label>
            <QuestionsMultiselect
              questions={tournamentQ.data?.questions.map((q) => q.id) || []}
              setQuestions={(questionIds) =>
                isAdmin &&
                handleUpdate({ tournament: {}, questions: questionIds })
              }
              disabled={!isAdmin}
              includeTournamentQuestions={tournamentId}
            />
            <span className="text-sm mt-2">
              <span className="font-semibold mr-2">Tip</span>Make sure that the
              questions included in the tournament are shared, otherwise they
              may not be visible to all viewers of this tournament page.
            </span>
          </div>
          {!includeShareTournament && (
            <FixTournamentQuestionSharing tournament={tournamentQ?.data} />
          )}
          {includeShareTournament && (
            <>
              <h4>Share tournament</h4>
              <ShareTournament tournamentId={tournamentId} />
            </>
          )}
          <div className="form-control flex-row items-center gap-2">
            <input
              id="showLeaderboard"
              type="checkbox"
              className="checkbox"
              checked={tournamentQ.data?.showLeaderboard}
              onChange={(e) =>
                handleUpdate({
                  tournament: { showLeaderboard: e.target.checked },
                })
              }
              disabled={!isAdmin}
            />
            <label className="label" htmlFor="showLeaderboard">
              <span className="label-text">Show leaderboard</span>
            </label>
          </div>
          {isAdmin && (
            <div className="form-control sm:flex-row items-center gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => exportToCsv.mutate({ tournamentId })}
                disabled={exportToCsv.isLoading}
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                {exportToCsv.isLoading ? "Exporting..." : "Export to CSV"}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete this tournament?",
                    )
                  ) {
                    deleteTournament.mutate({ id: tournamentId })
                  }
                }}
              >
                Delete tournament
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
