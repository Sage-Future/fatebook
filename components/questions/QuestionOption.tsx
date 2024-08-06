import { Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/20/solid"
import { QuestionType } from "@prisma/client"
import clsx from "clsx"
import {
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormUnregister,
} from "react-hook-form"
import { PredictFormType } from "../Predict"
import { OptionTextInput } from "./OptionTextInput"
import { PredictionPercentageInput } from "./PredictionPercentageInput"

interface QuestionOptionProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  errors: FieldErrors<PredictFormType>
  register: UseFormRegister<PredictFormType>
  unregister: UseFormUnregister<PredictFormType>
  watch: (name: string) => any
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
  optionId: number
  index: number
  questionType: QuestionType
  onRemove: () => void
  canRemove: boolean
  clearErrors: UseFormClearErrors<any>
}

export function QuestionOption({
  small,
  errors,
  register,
  unregister,
  watch,
  handleSubmit,
  onSubmit,
  optionId,
  index,
  questionType,
  onRemove,
  canRemove,
  clearErrors,
}: QuestionOptionProps) {
  const optionTextInputProps = {
    optionId,
    index,
    register,
    unregister,
    small,
    errors,
    handleSubmit,
    onSubmit,
  }

  const predictionPercentageInputProps = {
    small,
    errors,
    register,
    unregister,
    watch,
    handleSubmit,
    onSubmit,
    optionId,
    index,
    questionType,
  }

  const handleRemove = () => {
    // Unregister the removed fields
    unregister(`options.${index}.text`)
    unregister(`options.${index}.forecast`)

    // Clear errors for the removed option
    clearErrors(`options.${index}`)

    // Call the original onRemove function
    onRemove()
  }

  return (
    <div className="flex flex-row justify-between items-center gap-1.5">
      <OptionTextInput {...optionTextInputProps} />
      <span className="grow">
        <PredictionPercentageInput {...predictionPercentageInputProps} />
      </span>
      <Transition
        show={canRemove}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <button
          onClick={handleRemove}
          className={clsx(
            "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200 rounded-full",
            index === 0 && "mt-7",
          )}
          type="button"
        >
          <XMarkIcon className="h-8 w-8 p-0.5" />
        </button>
      </Transition>
    </div>
  )
}
