import { QuestionTypeProps } from "./question-types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { QuestionOption } from "../QuestionOption"
import { useWatch } from "react-hook-form"

interface MultiChoiceQuestionProps extends QuestionTypeProps {}

export function MultiChoiceQuestion({
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
}: MultiChoiceQuestionProps) {
  const [predictionInputRefs, setPredictionInputRefs] = useState<
    Record<string, HTMLInputElement | null>
  >({})

  // console.log(register)

  const setPredictionInputRef = useCallback(
    (id: string, node: HTMLInputElement | null) => {
      setPredictionInputRefs((prev) => {
        if (prev[id] === node) return prev // Prevent unnecessary updates
        return { ...prev, [id]: node }
      })
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
    predictionInputRefs, // not sure if this will work or needs reverting
    highlightResolveBy,
  }

  const predictButtonProps = {
    userId,
    onSubmit,
    session,
    errors,
    handleSubmit,
  }

  const questionOptionProps = {
    small,
    errors,
    register,
    watch,
    handleSubmit,
    onSubmit,
  }

  const numberOfOptions = 4

  const options = useMemo(
    () =>
      Array.from({ length: numberOfOptions }, (_, i) => ({
        id: i,
        props: {
          ...questionOptionProps,
          optionId: i,
          setPredictionInputRef,
        },
      })),
    [numberOfOptions, questionOptionProps, setPredictionInputRef],
  )

  // const allFields = useWatch({}) // Watching the entire form state
  //
  // useEffect(() => {
  //   console.log("Form State:", allFields) // Log the form state whenever it changes
  // }, [allFields])

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-col gap-4">
        {options.map(({ id, props }) => (
          <QuestionOption key={id} {...props} />
        ))}

        {embedded && <EmbeddedOptions register={register} />}
      </div>

      <div className="flex flex-row justify-between items-center gap-2">
        <ResolveBy {...resolveByProps} />
        <PredictButton {...predictButtonProps} />
      </div>
    </div>
  )
}

export default MultiChoiceQuestion
