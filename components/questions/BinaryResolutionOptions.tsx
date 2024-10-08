import { Menu } from "@headlessui/react"
import { Question, QuestionType, Resolution } from "@prisma/client"
import { UseTRPCMutationResult } from "@trpc/react-query/shared"
import clsx from "clsx"
import { toSentenceCase } from "../../lib/_utils_common"

interface BinaryResolutionOptionsProps {
  question: Question
  resolveQuestion: UseTRPCMutationResult<any, any, any, any> // This is lazy, should be more specific
  optionId?: string
}

export function BinaryResolutionOptions({
  question,
  resolveQuestion,
  optionId,
}: BinaryResolutionOptionsProps) {
  return (["YES", "NO", "AMBIGUOUS"] as Resolution[]).map(
    (resolution: Resolution) => (
      <Menu.Item key={resolution}>
        {({ active }) => (
          <button
            className={clsx(
              active ? "bg-indigo-500 text-white" : "bg-white text-neutral-900",
              `group flex w-full items-center rounded-md px-2 py-2 text-sm`,
            )}
            onClick={() => {
              resolveQuestion.mutate({
                questionId: question.id,
                resolution,
                questionType: QuestionType.BINARY,
                optionId,
              })
            }}
          >
            <div
              className={clsx(
                "h-3 w-3 mr-2 rounded-md",
                resolution === "YES"
                  ? "bg-green-500"
                  : resolution === "NO"
                    ? "bg-red-500"
                    : resolution === "AMBIGUOUS"
                      ? "bg-blue-500"
                      : "bg-neutral-200",
              )}
            />
            {toSentenceCase(resolution.toLowerCase())}
          </button>
        )}
      </Menu.Item>
    ),
  )
}
