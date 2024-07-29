import {
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormUnregister,
} from "react-hook-form"
import { PredictionPercentageInput } from "./PredictionPercentageInput"
import { OptionTextInput } from "./OptionTextInput"
import { PredictFormType } from "../Predict"
import { QuestionType } from "@prisma/client"
import { XMarkIcon } from "@heroicons/react/20/solid"

interface QuestionOptionProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  errors: FieldErrors<any>
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
    <div className="flex flex-row justify-between items-center gap-2">
      <OptionTextInput {...optionTextInputProps} />
      <PredictionPercentageInput {...predictionPercentageInputProps} />
      {canRemove && (
        <button
          onClick={handleRemove}
          className={`text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full ${index === 0 ? "mt-7" : ""}`}
          type="button"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>
      )}
    </div>
  )
}
