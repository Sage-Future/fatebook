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
  const [optionIds, setOptionIds] = useState(() => [0, 1])
  const [nextId, setNextId] = useState(2)

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

  const addOption = useCallback(() => {
    if (optionIds.length < MAX_OPTIONS) {
      setOptionIds((prev) => [...prev, nextId])
      setNextId((prev) => prev + 1)
    }
  }, [optionIds.length, nextId])

  const removeOption = useCallback((idToRemove: number) => {
    setOptionIds((prev) => prev.filter((id) => id !== idToRemove))
  }, [])

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-col gap-4">
        {optionIds.map((id, index) => (
          <QuestionOption
            key={id}
            optionId={id}
            {...questionOptionProps}
            index={index}
            questionType={QuestionType.MULTIPLE_CHOICE}
            onRemove={() => removeOption(id)}
            canRemove={optionIds.length > MIN_OPTIONS}
          />
        ))}

        {optionIds.length < MAX_OPTIONS && (
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
