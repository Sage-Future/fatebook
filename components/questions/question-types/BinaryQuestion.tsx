import { QuestionTypeProps } from "./question-types"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { PredictionPercentageInput } from "../PredictionPercentageInput"
import { useCallback, useRef } from "react"

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
          optionId={"0"}
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
