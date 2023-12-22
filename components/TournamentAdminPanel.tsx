import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Tournament } from '@prisma/client'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { getQuestionUrl } from '../lib/web/question_url'
import { api } from '../lib/web/trpc'
import { useUserId } from '../lib/web/utils'
import { InfoButton } from './InfoButton'
import { Predict } from './Predict'
import { QuestionsMultiselect } from './QuestionsMultiselect'
import { ShareTournament } from './ShareTournament'

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
    }
  })
  const router = useRouter()
  const deleteTournament = api.tournament.delete.useMutation({
    onSuccess: () => {
      void router.push('/')
    }
  })

  const [isCollapsed, setIsCollapsed] = useState(false)

  const userId = useUserId()
  const utils = api.useContext()
  const handleUpdate = ({ tournament, questions }: { tournament: Partial<Tournament>; questions?: string[]; }) => {
    console.log({ tournament })
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

  const isAdmin = userId && tournamentQ.data?.authorId === userId
    || (tournamentQ.data.anyoneInListCanEdit && tournamentQ.data.userList?.users.find(u => u.id === userId))

  return (
    <form
      className={clsx(
        "space-y-4 bg-white py-4 px-6 rounded-xl max-w-prose",
        collapsible && "shadow-md"
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className='my-2'>
          Tournament settings
          <InfoButton
            placement='bottom'
            tooltip={isAdmin ?
                (tournamentQ?.data.anyoneInListCanEdit ?
                    `Anyone in the ${tournamentQ?.data?.userList?.name} list can view and change these settings.`
                    :
                    'Only you can view and change these settings.')
                :
                'You are not an admin of this tournament and cannot change these settings.'
            }
            className='ml-2 font-normal tooltip-bottom' />
        </h3>
        {collapsible && <button
          className="btn btn-ghost"
          onClick={(e) => {
            setIsCollapsed(!isCollapsed)
            e.preventDefault()
          }}
        >
          {isCollapsed ?
            <ChevronLeftIcon className="w-5 h-5" /> :
            <ChevronDownIcon className="w-5 h-5" />}
        </button>}
      </div>
      {!isCollapsed && <div className='flex flex-col gap-4'>
        {!isAdmin && <p className="text-neutral-400 text-sm">You are not an admin of this tournament and cannot change these settings.</p>}
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
            onBlur={(e) => isAdmin && handleUpdate({ tournament: { name: e.target.value } })}
            disabled={!isAdmin} />
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
            onBlur={(e) => isAdmin && handleUpdate({ tournament: { description: e.target.value || null } })}
            disabled={!isAdmin} />
        </div>
        {includeAddNewQuestion && isAdmin && <>
          <h4 className="label">Add questions to this tournament</h4>
          <Predict
            questionDefaults={{
              tournamentId,
              unlisted: tournamentQ.data?.unlisted,
              sharePublicly: tournamentQ.data?.sharedPublicly,
              shareWithListIds: tournamentQ.data?.userListId ? [tournamentQ.data.userListId] : undefined,
            }}
            onQuestionCreate={() => {
              void utils.tournament.get.invalidate({ id: tournamentId })
            }}
            small={true}
          />
        </>}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Add existing questions to the tournament</span>
          </label>
          <QuestionsMultiselect
            questions={tournamentQ.data?.questions.map(q => q.id) || []}
            setQuestions={(questionIds) => isAdmin && handleUpdate({ tournament: {}, questions: questionIds })}
            disabled={!isAdmin} />
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
        {includeShareTournament && <>
          <h4>Share tournament</h4>
          <ShareTournament tournamentId={tournamentId} />
        </>}
        {isAdmin && <div className="form-control flex-row items-center gap-2">
          <button
            type='button'
            className="btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this tournament?')) {
                deleteTournament.mutate({ id: tournamentId })
              }
            }}
          >
            Delete tournament
          </button>
        </div>}
      </div>}
    </form>
  )
}
