import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Tournament } from '@prisma/client'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { InfoButton } from '../../components/InfoButton'
import { Questions } from '../../components/Questions'
import { QuestionsMultiselect } from '../../components/QuestionsMultiselect'
import { TournamentLeaderboard } from '../../components/TournamentLeaderboard'
import { getQuestionUrl } from '../../lib/web/question_url'
import { api } from '../../lib/web/trpc'
import { signInToFatebook, useUserId } from '../../lib/web/utils'

export default function TournamentPage() {
  const userId = useUserId()
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.tournament_id && (router.query.tournament_id as string).match(/(.*)--(.*)/)
  const tournamentId = parts ? parts[2] : (router.query.tournament_id as string) || ""

  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })

  const isAdmin = tournamentQ.data?.authorId === userId

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={tournamentQ.data?.name || "Prediction tournament"} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {
            !userId && <div className='text-center'>
              <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
                Sign in to see all questions and add your own predictions
              </button>
            </div>
          }
          {
            isAdmin && <TournamentAdminPanel tournamentId={tournamentId} />
          }
          {
            tournamentQ.data ?
              <Questions
                title={tournamentQ.data?.name ? `${tournamentQ.data.name}` : "Loading..."}
                noQuestionsText='No questions in this tournament yet.'
                filterTournamentId={tournamentId}
                description={tournamentQ.data?.description || undefined}
              />
              :
              <h3 className="text-neutral-600">{tournamentQ.isLoading ? "Loading..." : ""}</h3>
          }
          <TournamentLeaderboard tournamentId={tournamentId} />
        </div>
      </div>
    </div>
  )
}

function TournamentAdminPanel({
  tournamentId,
}: {
  tournamentId: string,
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
  const router = useRouter()
  const deleteTournament = api.tournament.delete.useMutation({
    onSuccess: () => {
      void router.push('/')
    }
  })

  const [isCollapsed, setIsCollapsed] = useState(false)

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

  return (
    <form className="space-y-4 bg-white shadow-md py-4 px-6 rounded-xl">
      <div className="flex justify-between items-center">
        <h3 className='my-2'>
          Tournament settings
          <InfoButton
            tooltip='Only you can view and change these settings.'
            className='ml-2 font-normal tooltip-bottom'
          />
        </h3>
        <button
          className="btn btn-ghost"
          onClick={(e) => {
            setIsCollapsed(!isCollapsed)
            e.preventDefault()
          }}
        >
          {isCollapsed ?
            <ChevronLeftIcon className="w-5 h-5" /> :
            <ChevronDownIcon className="w-5 h-5" />
          }
        </button>
      </div>
      {!isCollapsed && <div className='flex flex-col gap-4'>
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
            onBlur={(e) => handleUpdate({tournament: {name: e.target.value}})}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="tournamentDescription">
            <span className="label-text">Description</span>
            <InfoButton tooltip='Markdown formatting is supported' className='tooltip-left' />
          </label>
          <textarea
            id="tournamentDescription"
            className="textarea textarea-bordered"
            placeholder="Description (optional)"
            defaultValue={tournamentQ.data?.description || ""}
            onBlur={(e) => handleUpdate({tournament: {description: e.target.value || null}})}
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Add questions to the tournament</span>
          </label>
          <QuestionsMultiselect
            questions={tournamentQ.data?.questions.map(q => q.id) || []}
            setQuestions={(questionIds) => handleUpdate({tournament: {}, questions: questionIds})}
          />
          <span className='text-sm mt-2'>
            <span className='font-semibold mr-2'>
              Tip
            </span>Make sure that the questions included in the tournament are shared, otherwise they may not be visible to all viewers of this tournament page.
          </span>
          {tournamentQ.data?.sharedPublicly && tournamentQ.data?.questions.some(q => !q.sharedPublicly) && (
            <div className="bg-indigo-100 px-6 text-sm rounded-lg mt-4">
              <div>
                <p>
                  <span className='font-semibold'>
                    Warning
                  </span>: This tournament is shared publicly but contains some questions that are not shared publicly.
                </p>
                <p>
                  These questions will not be visible to all viewers of this tournament page:
                </p>
                <ul>
                  {tournamentQ.data?.questions.filter(q => !q.sharedPublicly).map(q => (
                    <li key={q.id}>
                      <Link href={getQuestionUrl(q)} target='_blank'>{q.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
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
        </div>
        <div className="form-control flex-row items-center gap-2">
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
        </div>
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
        <div className="form-control flex-row items-center gap-2">
          <button
            className="btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this tournament?')) {
                deleteTournament.mutate({ id: tournamentId })
              }
            }}
          >
            Delete tournament
          </button>
        </div>
      </div>}
    </form>
  )
}

