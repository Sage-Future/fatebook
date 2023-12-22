import { ChevronDownIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link.js'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { getQuestionUrl } from '../lib/web/question_url'
import { api } from '../lib/web/trpc'
import type { TournamentWithQuestionsAndSharedWithLists } from '../prisma/additional'
import { invalidateQuestion, useUserId } from '../lib/web/utils'

export function FixTournamentQuestionSharing({
  tournament
}: {
  tournament: TournamentWithQuestionsAndSharedWithLists
 }) {
  const userId = useUserId()

  const unsharedPublicly = tournament?.questions.filter(
    q => tournament.sharedPublicly && !q.sharedPublicly
  )
  const unsharedWithList = tournament.questions.filter(
    q => tournament.userListId && !q.sharedWithLists?.find(l => l.id === tournament.userListId) && !q.sharedPublicly
  )

  const utils = api.useContext()
  const sharePublicly = api.question.setSharedPublicly.useMutation({
    onSuccess(data, { questionId }) {
      void invalidateQuestion(utils, {id: questionId})
      void utils.tournament.get.invalidate({id: tournament.id})
    }
  })
  const shareWithList = api.userList.setQuestionLists.useMutation({
    onSuccess(data, { questionId }) {
      void invalidateQuestion(utils, {id: questionId})
      void utils.tournament.get.invalidate({id: tournament.id})
      if (tournament.userListId) void utils.userList.get.invalidate({id: tournament.userListId})
    }
  })

  const [expandPublicly, setExpandPublicly] = useState(false)
  const [expandWithList, setExpandWithList] = useState(false)

  const handleSharePublicly = (questionId: string) => {
    sharePublicly.mutate({ questionId, sharedPublicly: true })
  }

  const handleShareWithList = (questionId: string) => {
    if (!tournament.userListId) {
      return toast.error("Something went wrong - couldn't share with list")
    }
    shareWithList.mutate({ questionId, listIds: [tournament.userListId] })
  }

  if (!unsharedPublicly.length && !unsharedWithList.length) {
    return <></>
  }

  return (
    <div className="" onClick={e => {e.stopPropagation(); e.preventDefault()}}>
      <div className='flex flex-col gap-4'>
        {[
          {
            questions: unsharedPublicly,
            title: "questions in this tournament aren't shared publicly",
            handleShare: handleSharePublicly,
            expand: expandPublicly,
            setExpand: setExpandPublicly
          },
          {
            questions: unsharedWithList,
            title: `questions in this tournament aren't shared with your team '${tournament.userList?.name || ""}'`,
            handleShare: handleShareWithList,
            expand: expandWithList,
            setExpand: setExpandWithList
          }
        ].map(({ questions, title, handleShare, expand, setExpand }) => (
          questions.length > 0 && (
            <div key={title} className="flex flex-col items-start space-y-2 bg-neutral-50 px-6 py-4 outline outline-neutral-200 outline-1 text-sm rounded-lg mt-4">
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className='mb-2'>
                    {questions.length}{" "}{title}
                  </div>

                  {questions.length === 1 ? (
                    <button className="btn" role="button" onClick={() => handleShare(questions[0].id)} disabled={sharePublicly.isLoading || shareWithList.isLoading}>
                      Share question <i>{questions[0].title.length > 40 ? `${questions[0].title.substring(0, 40)}...` : questions[0].title}</i>
                    </button>
                  ) : (
                    <button className="btn " role="button" onClick={() => questions.forEach(q => (q.userId === userId) && handleShare(q.id))} disabled={sharePublicly.isLoading || shareWithList.isLoading}>
                      Share all {questions.length} questions
                    </button>
                  )}
                </div>
                <button className="btn btn-xs p-2 mt-2 text-neutral-900" role="button" onClick={() => setExpand(!expand)}>
                  <ChevronDownIcon className={clsx("w-4 h-4", expand && 'transform rotate-180')} />
                </button>
              </div>
              {expand && (
                <ul className="space-y-2 p-2 w-full bg-white rounded-md">
                  {questions.map(q => (
                    <li key={q.id} className="flex gap-2 justify-between items-center">
                      <Link className='no-underline hover:underline my-auto' href={getQuestionUrl(q)} >{q.title}</Link>
                      <button className="btn my-auto shrink" role="button" onClick={() => handleShare(q.id)} disabled={sharePublicly.isLoading || shareWithList.isLoading || q.userId !== userId}>
                        {q.userId === userId ? "Share" : "Can't share (you're not the author)"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  )


}
