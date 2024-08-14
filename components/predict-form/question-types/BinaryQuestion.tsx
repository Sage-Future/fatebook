import { QuestionType } from "@prisma/client"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { PredictionPercentageInput } from "../PredictionPercentageInput"
import { ResolveBy } from "../ResolveBy"
import { QuestionTypeProps } from "./question-types"

export function BinaryQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  onSubmit,
  highlightResolveBy,
}: QuestionTypeProps) {
  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-row gap-2">
        <ResolveBy
          small={small}
          resolveByButtons={resolveByButtons}
          questionDefaults={questionDefaults}
          highlightResolveBy={highlightResolveBy}
        />

        <PredictionPercentageInput
          small={small}
          questionType={QuestionType.BINARY}
          onSubmit={onSubmit}
        />

        {embedded && <EmbeddedOptions onSubmit={onSubmit} />}
      </div>

      <div className="self-center">
        <PredictButton onSubmit={onSubmit} />
      </div>
    </div>
  )
}

export default BinaryQuestion
