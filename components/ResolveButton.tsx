import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Question, Resolution } from "@prisma/client"
import clsx from 'clsx'
import { Fragment } from 'react'
import { getResolutionEmoji, toSentenceCase } from '../lib/_utils_common'
import { api } from '../lib/web/trpc'
import { useUserId } from '../lib/web/utils'

export function ResolveButton({
  question
} : {
  question: Question
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const resolveQuestion = api.question.resolveQuestion.useMutation({
    async onSettled() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      await utils.question.getQuestion.invalidate({questionId: question.id})
      await utils.question.getQuestionScores.invalidate()
    },
  })
  const undoResolution = api.question.undoResolution.useMutation({
    async onSettled() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      await utils.question.getQuestion.invalidate({questionId: question.id})
      await utils.question.getQuestionScores.invalidate()
    },
  })
  const resolution = question.resolution

  if (question.userId !== userId && !resolution) {
    return <span></span>
  }

  return (
    <div className="text-right">
      <Menu as="div" className="inline-block text-left relative w-full">
        <div className='w-full'>
          <Menu.Button
            className={clsx(
              "inline-flex w-full justify-center rounded-md bg-black bg-opacity-80 px-4 py-1.5 text-sm font-medium hover:bg-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 disabled:opacity-30",
              resolution === "YES" ? "bg-green-500 text-white" : resolution === "NO" ? "bg-red-500 text-white" : resolution === "AMBIGUOUS" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
            )}
            disabled={resolveQuestion.isLoading || undoResolution.isLoading || question.userId !== userId}
            onClick={(e) => {e.stopPropagation()}}
          >
            {resolution ? resolution : "Resolve"}
            {!resolution && <ChevronDownIcon
              className="ml-2 -mr-2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />}
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute z-40 right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 " onClick={(e) => e.stopPropagation()}>
              {question.resolution ?
                <Menu.Item key={resolution}>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active ? 'bg-indigo-500 text-white' : 'bg-white text-gray-900',
                        `group flex w-full items-center rounded-md px-2 py-2 text-sm`)}
                      onClick={() => {
                        undoResolution.mutate({
                          questionId: question.id,
                        })
                      }}
                    >
                      Undo resolution
                    </button>
                  )}
                </Menu.Item>
                :
                (["YES", "NO", "AMBIGUOUS"] as Resolution[]).map((resolution: Resolution) => (
                  <Menu.Item key={resolution}>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? 'bg-indigo-500 text-white' : 'bg-white text-gray-900',
                          `group flex w-full items-center rounded-md px-2 py-2 text-sm`)}
                        onClick={() => {
                          resolveQuestion.mutate({
                            questionId: question.id,
                            resolution,
                          })
                        }}
                      >
                        {`${getResolutionEmoji(resolution)} ${toSentenceCase(resolution.toLowerCase())}`}
                      </button>
                    )}
                  </Menu.Item>
                ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}