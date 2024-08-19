import {
  QuestionOptionWithForecasts,
  QuestionWithStandardIncludes,
} from "../../prisma/additional"
import { ResolveButton } from "./ResolveButton"
import { UpdateableLatestForecast } from "./UpdateableLatestForecast"

export function QuestionDetailsOption({
  option,
  question,
  autoFocus,
  embedded,
  cumulativeForecast,
}: {
  option: QuestionOptionWithForecasts
  question: QuestionWithStandardIncludes
  autoFocus?: boolean
  embedded?: boolean
  cumulativeForecast?: number
}) {
  return (
    <div className="contents">
      <span className={"max-w-[500px] overflow-x-auto mr-2"}>
        {option.text}
      </span>
      <div className={"contents"}>
        <UpdateableLatestForecast
          question={question}
          autoFocus={autoFocus}
          embedded={embedded}
          option={option}
          cumulativeForecast={cumulativeForecast}
          small={true}
          key={option.id}
          showErrorMessage={true}
        />
        {question.exclusiveAnswers ? (
          <div />
        ) : (
          <span className="ml-2">
            <ResolveButton question={question} optionId={option.id} />
          </span>
        )}
      </div>
    </div>
  )
}
