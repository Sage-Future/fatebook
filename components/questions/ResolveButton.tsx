import { Menu, Transition } from "@headlessui/react"
import { ChevronDownIcon } from "@heroicons/react/20/solid"
import { Resolution } from "@prisma/client"
import clsx from "clsx"
import { Fragment } from "react"
import { api } from "../../lib/web/trpc"
import { invalidateQuestion, useUserId } from "../../lib/web/utils"
import { QuestionWithStandardIncludes } from "../../prisma/additional"
import { BinaryResolutionOptions } from "./BinaryResolutionOptions"
import { MultiChoiceResolutionOptions } from "./MultiChoiceResolutionOptions"

export function ResolveButton({
  question,
  optionId,
}: {
  question: QuestionWithStandardIncludes
  optionId?: string
}) {
  const userId = useUserId()
  const utils = api.useContext()
  const resolveQuestion = api.question.resolveQuestion.useMutation({
    async onSettled() {
      await invalidateQuestion(utils, question)
      await utils.question.getQuestionScores.invalidate()
      await utils.question.getBucketedForecasts.invalidate()
    },
  })
  const undoResolution = api.question.undoResolution.useMutation({
    async onSettled() {
      await invalidateQuestion(utils, question)
      await utils.question.getQuestionScores.invalidate()
      await utils.question.getBucketedForecasts.invalidate()
    },
  })
  const resolution: string | null = getResolution(question)

  function getResolution(
    question: QuestionWithStandardIncludes,
  ): string | null {
    if (question.options && optionId) {
      for (const option of question.options) {
        if (option.id === optionId && option.resolution) {
          return option.resolution
        }
      }
      return null
    }
    if (!question.resolved) {
      return null
    }
    // TODO: how will this work for non-exclusive answers?
    if (question.options && question.options.length > 0) {
      for (const option of question.options) {
        if (option.resolution === Resolution.YES) {
          return option.text
        }
      }
      return question.resolution === Resolution.AMBIGUOUS
        ? Resolution.AMBIGUOUS
        : "Other"
    } else {
      return question.resolution
    }
  }

  if (question.userId !== userId && !resolution) {
    return <span></span>
  }

  return (
    <div
      className={`text-right ${question.exclusiveAnswers === true ? "" : "h-full"}`}
    >
      <Menu as="div" className="inline-block text-left relative w-full h-full">
        <div
          className={`w-full ${question.exclusiveAnswers === true ? "" : "h-full"}`}
        >
          <Menu.Button
            className={clsx(
              "inline-flex w-full justify-center rounded-md bg-black bg-opacity-80 px-4 py-1.5 text-sm font-medium hover:bg-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 disabled:opacity-70 h-full items-center",
              // TODO: clean this up
              resolution === "YES"
                ? "bg-green-500 text-white"
                : resolution === "NO" || resolution === "Other"
                  ? "bg-red-500 text-white"
                  : resolution === "AMBIGUOUS"
                    ? "bg-blue-500 text-white"
                    : resolution // Has resolved to an MCQ option
                      ? "bg-green-500 text-white"
                      : question.resolveBy < new Date()
                        ? "bg-neutral-200 text-neutral-700 ring-2 ring-inset ring-indigo-200 ring-opacity-70 hover:ring-opacity-100"
                        : "bg-neutral-200 text-neutral-700",
            )}
            disabled={
              resolveQuestion.isLoading ||
              undoResolution.isLoading ||
              question.userId !== userId
            }
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {resolution ? resolution : "Resolve"}
            {!resolution && (
              <ChevronDownIcon
                className="ml-2 -mr-2 h-5 w-5 text-neutral-400"
                aria-hidden="true"
              />
            )}
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
          <Menu.Items className="absolute z-40 right-0 mt-2 w-40 origin-top-right divide-y divide-neutral-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 " onClick={(e) => e.stopPropagation()}>
              {question.resolution || resolution ? (
                <Menu.Item key={resolution}>
                  {({ active }) => (
                    <button
                      className={clsx(
                        active
                          ? "bg-indigo-500 text-white"
                          : "bg-white text-neutral-900",
                        `group flex w-full items-center rounded-md px-2 py-2 text-sm`,
                      )}
                      onClick={() => {
                        undoResolution.mutate({
                          questionId: question.id,
                          optionId: question.exclusiveAnswers
                            ? undefined
                            : optionId,
                        })
                      }}
                    >
                      Undo resolution
                    </button>
                  )}
                </Menu.Item>
              ) : question.type === "BINARY" || !question.exclusiveAnswers ? (
                <BinaryResolutionOptions
                  question={question}
                  resolveQuestion={resolveQuestion}
                  optionId={optionId}
                />
              ) : question.type === "MULTIPLE_CHOICE" ? (
                <MultiChoiceResolutionOptions
                  question={question}
                  resolveQuestion={resolveQuestion}
                />
              ) : null}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
