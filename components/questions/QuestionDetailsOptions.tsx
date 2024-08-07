import {
  QuestionOptionWithForecasts,
  QuestionWithStandardIncludes,
} from "../../prisma/additional"
import { ResolveButton } from "./ResolveButton"
import { UpdateableLatestForecast } from "./UpdateableLatestForecast"

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
      <span className={"max-w-[500px] overflow-x-auto"}>{option.text}</span>
      <div className={"contents"}>
        <UpdateableLatestForecast
          question={question}
          autoFocus={autoFocus}
          embedded={embedded}
          option={option}
          cumulativeForecast={cumulativeForecast}
        />
        {question.exclusiveAnswers ? (
          <div />
        ) : (
          <ResolveButton question={question} optionId={option.id} />
        )}
      </div>
    </div>
  )
}
