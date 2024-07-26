import { QuestionTypeProps } from "./question-types"
import { useCallback, useState } from "react"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { QuestionOption } from "../QuestionOption"
import { QuestionType } from "@prisma/client"
import { UseFormUnregister } from "react-hook-form"
import { PredictFormType } from "../../Predict"
import { PlusIcon } from "@heroicons/react/20/solid"
interface MultiChoiceQuestionProps extends QuestionTypeProps {
  unregister: UseFormUnregister<PredictFormType>
}

export function MultiChoiceQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  userId,
  onSubmit,
  session,
  register,
  unregister,
  setValue,
  errors,
  watch,
  handleSubmit,
  highlightResolveBy,
  clearErrors,
}: MultiChoiceQuestionProps) {
  const MIN_OPTIONS = 2
  const MAX_OPTIONS = 10
  const [numberOfOptions, setNumberOfOptions] = useState(2)

  const resolveByProps = {
    small,
    resolveByButtons,
    questionDefaults,
    register,
    setValue,
    errors,
    watch,
    highlightResolveBy,
  }

  const predictButtonProps = {
    userId,
    onSubmit,
    session,
    errors,
    clearErrors,
    handleSubmit,
  }

  const questionOptionProps = {
    small,
    errors,
    register,
    unregister,
    watch,
    handleSubmit,
    onSubmit,
    setValue,
    clearErrors,
  }

  const [options, setOptions] = useState(() =>
    Array.from({ length: 2 }, (_, i) => ({
      id: i,
      props: {
        ...questionOptionProps,
        optionId: i,
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
          },
        },
      ])
    }
  }, [numberOfOptions, options.length, questionOptionProps])

  const removeOption = useCallback((idToRemove: number) => {
    setOptions((prev) => prev.filter((option) => option.id !== idToRemove))
  }, [])

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-col gap-4">
        {options.map(({ id, props }, index) => (
          <QuestionOption
            key={id}
            {...props}
            index={index}
            questionType={QuestionType.MULTIPLE_CHOICE}
            onRemove={() => removeOption(id)}
            canRemove={options.length > MIN_OPTIONS}
          />
        ))}

        {options.length < MAX_OPTIONS && (
          <div className="flex flex-row justify-between items-center gap-2">
            <div className="flex-grow">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  addOption()
                }}
                className="btn bg-neutral-200 bg-opacity-80 flex items-center justify-center px-4 py-2 text-neutral-500 border rounded-md hover:bg-opacity-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <span>Add Option</span>
              </button>
            </div>
            <div className=""></div>
            <div className=""></div>
          </div>
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
