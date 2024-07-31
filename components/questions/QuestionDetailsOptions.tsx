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
  cumulativeForecast?: number
}

export function QuestionDetailsOption({
  option,
  question,
  autoFocus,
  embedded,
  cumulativeForecast,
}: QuestionDetailsOptionsProps) {
  return (
    <div className="col-span-2 flex gap-4 mb-1 justify-between">
      <span>{option.text}</span>
      <div className={"flex align-middle"}>
        <UpdateableLatestForecast
          question={question}
          autoFocus={autoFocus}
          embedded={embedded}
          option={option}
          cumulativeForecast={cumulativeForecast}
        />
        {!question.exclusiveAnswers && (
          <ResolveButton question={question} optionId={option.id} />
        )}
      </div>
    </div>
  )
}
