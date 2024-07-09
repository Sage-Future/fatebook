import { Menu } from "@headlessui/react"
import clsx from "clsx"
import { toSentenceCase } from "../../../lib/_utils_common"
import { UseTRPCMutationResult } from "@trpc/react-query/shared"
import { QuestionWithStandardIncludes } from "../../../prisma/additional"

interface MultiChoiceResolutionOptionsProps {
  question: QuestionWithStandardIncludes
  resolveQuestion: UseTRPCMutationResult<any, any, any, any> // TODO: probably not this
}

export function MultiChoiceResolutionOptions({
  question,
  resolveQuestion,
}: MultiChoiceResolutionOptionsProps) {
  const options = question.options!.map((option) => option.text)
  options.push("AMBIGUOUS")
  options.push("OTHER")
  return options.map((option: string) => (
    <Menu.Item key={option}>
      {({ active }) => (
        <button
          className={clsx(
            active ? "bg-indigo-500 text-white" : "bg-white text-neutral-900",
            `group flex w-full items-center rounded-md px-2 py-2 text-sm`,
          )}
          onClick={() => {
            resolveQuestion.mutate({
              questionId: question.id,
              option,
            })
          }}
        >
          <div
            className={clsx(
              "h-3 w-3 mr-2 rounded-md",
              option === "YES"
                ? "bg-green-500"
                : option === "NO"
                  ? "bg-red-500"
                  : option === "AMBIGUOUS"
                    ? "bg-blue-500"
                    : "bg-neutral-200",
            )}
          />
          {toSentenceCase(option.toLowerCase())}
        </button>
      )}
    </Menu.Item>
  ))
}
