import { QuestionType } from "@prisma/client"
import clsx from "clsx"

interface QuestionTypeSelectProps {
  questionType: QuestionType
  setQuestionType: (type: QuestionType) => void
}

export function QuestionTypeSelect({
  questionType,
  setQuestionType,
}: QuestionTypeSelectProps) {
  return (
    <div className="flex gap-2 mb-3">
      <button
        className={clsx(
          "btn",
          questionType !== QuestionType.BINARY && "btn-ghost",
        )}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.BINARY)
        }}
      >
        Yes or no
      </button>
      <button
        className={clsx(
          "btn",
          questionType !== QuestionType.MULTIPLE_CHOICE && "btn-ghost",
        )}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.MULTIPLE_CHOICE)
        }}
      >
        Multiple choice
      </button>
    </div>
  )
}
