import { PlusIcon } from "@heroicons/react/20/solid"
import { QuestionType } from "@prisma/client"
import { useCallback, useState } from "react"
import { UseFormUnregister } from "react-hook-form"
import { PredictFormType } from "../../Predict"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { GenericCheckbox } from "../GenericCheckbox"
import { PredictButton } from "../PredictButton"
import { QuestionOption } from "../QuestionOption"
import { ResolveBy } from "../ResolveBy"
import { QuestionTypeProps } from "./question-types"
interface MultiChoiceQuestionProps extends QuestionTypeProps {
  unregister: UseFormUnregister<PredictFormType>
}

export default function MultiChoiceQuestion({
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
  control,
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
    watch,
    control,
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

  const nonExclusiveCheckboxProps = {
    register,
    handleSubmit,
    onSubmit,
    name: "nonExclusive" as keyof PredictFormType,
    label: "Allow resolution to multiple options?",
    helpText:
      "If selected, you can resolve multiple options to YES. Otherwise, you can only resolve a single option to YES (and an OTHER option is added by default).",
    labelClassName: "text-sm",
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
    <div
      className={`flex flex-col gap-4 flex-wrap justify-between ${embedded ? "flex-col" : "flex-row"}`}
    >
      {embedded && (
        <EmbeddedOptions
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
        />
      )}

      <div className="flex flex-col gap-2 w-fit">
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
                className="btn btn-sm text-neutral-500"
              >
                <PlusIcon className="w-5 h-5" />
                Add option
              </button>
            </div>
            <div className=""></div>
            <div className=""></div>
          </div>
        )}

        <GenericCheckbox {...nonExclusiveCheckboxProps} />
      </div>

      <div className="flex flex-col justify-end">
        <div className="flex flex-row justify-between items-center gap-2">
          <ResolveBy {...resolveByProps} />
          <PredictButton {...predictButtonProps} />
        </div>
      </div>
    </div>
  )
}
