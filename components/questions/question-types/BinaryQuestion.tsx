import { QuestionTypeProps } from "./question-types"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { PredictionPercentageInput } from "../PredictionPercentageInput"
import { useCallback, useRef } from "react"
import { QuestionType } from "@prisma/client"

interface BinaryQuestionProps extends QuestionTypeProps {}

export function BinaryQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  userId,
  onSubmit,
  session,
  register,
  setValue,
  errors,
  watch,
  handleSubmit,
  textAreaRef,
  highlightResolveBy,
}: BinaryQuestionProps) {
  const predictionInputRefMine = useRef<HTMLInputElement | null>(null)

  const setPredictionInputRef = useCallback(
    (optionId: string, node: HTMLInputElement | null) => {
      predictionInputRefMine.current = node
    },
    [],
  )

  const resolveByProps = {
    small,
    resolveByButtons,
    questionDefaults,
    onSubmit,
    register,
    setValue,
    errors,
    watch,
    handleSubmit,
    textAreaRef,
    predictionInputRefMine,
    highlightResolveBy,
  }

  const predictButtonProps = {
    userId,
    onSubmit,
    session,
    errors,
    handleSubmit,
  }

  const predictionPercentageInputProps = {
    small,
    errors,
    register,
    watch,
    handleSubmit,
    onSubmit,
    setPredictionInputRef,
  }

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-row gap-2">
        <ResolveBy {...resolveByProps} />

        <PredictionPercentageInput
          {...predictionPercentageInputProps}
          optionId={0} // TODO: could just make this field optional and decide based on whether or not its set, rather than have the extra QuestionType field
          questionType={QuestionType.BINARY}
        />

        {embedded && <EmbeddedOptions register={register} />}
      </div>

      <div className="self-center">
        <PredictButton {...predictButtonProps} />
      </div>
    </div>
  )
}

export default BinaryQuestion
