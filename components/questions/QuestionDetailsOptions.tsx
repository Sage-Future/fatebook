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
    <div className="contents">
      <span>{option.text}</span>
      <div className={"contents"}>
        <UpdateableLatestForecast
          question={question}
          autoFocus={autoFocus}
          embedded={embedded}
          option={option}
          cumulativeForecast={cumulativeForecast}
        />
        {question.exclusiveAnswers ? (
          <div></div>
        ) : (
          <ResolveButton question={question} optionId={option.id} />
        )}
      </div>
    </div>
  )
}
