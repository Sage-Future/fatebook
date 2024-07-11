import { QuestionTypeProps } from "./question-types"
import { useCallback, useState } from "react"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { QuestionOption } from "../QuestionOption"
import { QuestionType } from "@prisma/client"
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

  const MIN_OPTIONS = 2
  const MAX_OPTIONS = 10
  const [numberOfOptions, setNumberOfOptions] = useState(2)

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

  const [options, setOptions] = useState(() =>
    Array.from({ length: 2 }, (_, i) => ({
      id: i,
      props: {
        ...questionOptionProps,
        optionId: i,
        setPredictionInputRef,
      },
    })),
  )

  const addOption = useCallback(() => {
    if (options.length < MAX_OPTIONS) {
      setNumberOfOptions((prev) => prev + 1)
      setOptions((prev) => [
        ...prev,
        {
          id: numberOfOptions,
          props: {
            ...questionOptionProps,
            optionId: numberOfOptions,
            setPredictionInputRef,
          },
        },
      ])
    }
  }, [
    numberOfOptions,
    options.length,
    questionOptionProps,
    setPredictionInputRef,
  ])

  console.log(errors)

  const removeOption = useCallback((idToRemove: number) => {
    setOptions((prev) => prev.filter((option) => option.id !== idToRemove))
  }, [])

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-col gap-4">
        {options.map(({ id, props }) => (
          <QuestionOption
            key={id}
            {...props}
            questionType={QuestionType.MULTIPLE_CHOICE}
            onRemove={() => removeOption(id)}
            canRemove={options.length > MIN_OPTIONS}
          />
        ))}

        {options.length < MAX_OPTIONS && (
          <button
            onClick={(e) => {
              e.preventDefault()
              addOption()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Option
          </button>
        )}

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
