import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Tournament } from '@prisma/client'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { InfoButton } from '../../components/InfoButton'
import { Questions } from '../../components/Questions'
import { QuestionsMultiselect } from '../../components/QuestionsMultiselect'
import { round } from '../../lib/_utils_common'
import { api } from '../../lib/web/trpc'
import { ifEmpty, signInToFatebook, useUserId } from '../../lib/web/utils'
import Link from 'next/link'
import { getQuestionUrl } from '../../lib/web/question_url'

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

function TournamentLeaderboard({
  tournamentId,
}: {
  tournamentId: string,
}) {
  const tournamentQ = api.tournament.get.useQuery({
    id: tournamentId,
  })

  const [sortConfig, setSortConfig] = useState({ key: 'player', direction: 'ascending' })

  const scoresByPlayer = useMemo(() => {
    if (!tournamentQ.data) return []

    return tournamentQ.data.questions.flatMap(question =>
      question.questionScores.map(score => ({
        userId: score.userId,
        userName: score.user.name,
        absoluteScore: score.absoluteScore,
        relativeScore: score.relativeScore,
        numForecasts: question.forecasts.length,
        numQuestions: question.forecasts.length > 0 ? 1 : 0,
      }))
    )
    .reduce((acc: any[], curr: any) => {
      const existing = acc.find(a => a.userId === curr.userId)
      if (existing) {
        existing.absoluteScore += curr.absoluteScore
        existing.relativeScore += curr.relativeScore
        existing.numForecasts += curr.numForecasts
        existing.numQuestions += curr.numQuestions
      } else {
        acc.push({...curr})
      }
      return acc
    }, [])
    .map((player: any) => ({
      ...player,
      absoluteScore: player.absoluteScore / player.numQuestions,
      relativeScore: player.relativeScore / player.numQuestions,
    }))
  }, [tournamentQ.data])

  const sortedScores = useMemo(() => {
    if (!tournamentQ.data) return []

    const sortableScores = [...scoresByPlayer]
    if (sortConfig.key === 'user') {
      sortableScores.sort((a, b) => {
        if (a.user.name < b.user.name) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a.user.name > b.user.name) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    } else {
      sortableScores.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableScores
  }, [tournamentQ.data, scoresByPlayer, sortConfig.key, sortConfig.direction])

  const requestSort = (key: string) => {
    let direction = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  if (!tournamentQ.data) {
    return <></>
  }

  console.log({scoresByPlayer, sortedScores})

  return (
    <div>
      <h2 className='select-none'>Leaderboard</h2>
      <div className='bg-white'>
        <table className="table w-full overflow-x-scroll py-2">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => requestSort('user')}>Player</th>
              <th className="cursor-pointer" onClick={() => requestSort('absoluteScore')}>
                Brier<br/>score <InfoButton className='font-normal ml-1' tooltip='Lower is better!' />
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('relativeScore')}>
                Relative<br/>Brier <InfoButton className='font-normal ml-1' tooltip='Lower is better! Relative to the median on each question' />
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('numQuestions')}>Questions<br/>forecasted</th>
              <th className="cursor-pointer" onClick={() => requestSort('numForecasts')}>Total<br/>forecasts</th>
            </tr>
          </thead>
          <tbody>
            {ifEmpty(sortedScores.map((score) => (
              <tr key={score.userId}>
                <td>{score.userName}</td>
                <td>{round(score.absoluteScore, 2)}</td>
                <td>{round(score.relativeScore, 2)}</td>
                <td>{tournamentQ.data.questions.length}</td>
                <td>{tournamentQ.data.questions.flatMap(q => q.forecasts).length}</td>
              </tr>
            )), <tr><td colSpan={5} className='italic text-neutral-500 text-center'>No resolved questions yet</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}