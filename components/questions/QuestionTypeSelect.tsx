import { QuestionType } from "@prisma/client"

interface QuestionTypeSelectProps {
  questionType: QuestionType
  setQuestionType: (type: QuestionType) => void
}

export function QuestionTypeSelect({
  questionType,
  setQuestionType,
}: QuestionTypeSelectProps) {
  return (
    <div className="flex gap-1 mb-4">
      <button
        className={`btn  ${
          questionType === QuestionType.BINARY
            ? "btn-primary"
            : "text-neutral-500"
        }`}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.BINARY)
        }}
      >
        Yes or No
      </button>
      <button
        className={`btn ${
          questionType === QuestionType.MULTIPLE_CHOICE
            ? "btn-primary"
            : " text-neutral-500"
        }`}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.MULTIPLE_CHOICE)
        }}
      >
        Multiple Choice
      </button>
    </div>
  )
}
