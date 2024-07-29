import {
  QuestionOptionWithForecasts,
  QuestionWithStandardIncludes,
} from "../../prisma/additional"
import { UpdateableLatestForecast } from "../UpdateableLatestForecast"
import { ResolveButton } from "../ResolveButton"

interface QuestionDetailsOptionsProps {
  option: QuestionOptionWithForecasts
  question: QuestionWithStandardIncludes
  autoFocus?: boolean
  embedded?: boolean
}

export function QuestionDetailsOption({
  option,
  question,
  autoFocus,
  embedded,
}: QuestionDetailsOptionsProps) {
  return (
    <div className="col-span-2 flex gap-4 mb-1 justify-between">
      <span>{option.text}</span>
      <UpdateableLatestForecast
        question={question}
        autoFocus={autoFocus}
        embedded={embedded}
        option={option}
      />
      {!question.exclusiveAnswers && (
        <ResolveButton question={question} optionId={option.id} />
      )}
    </div>
  )
}
