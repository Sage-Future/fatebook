import {
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormUnregister,
} from "react-hook-form"
import { PredictionPercentageInput } from "./PredictionPercentageInput"
import { OptionTextInput } from "./OptionTextInput"
import { PredictFormOptionType, PredictFormType } from "../Predict"
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
  setValue: UseFormSetValue<any>
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
  setValue,
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
    // Get the current options
    const currentOptions = watch("options") as PredictFormOptionType[]

    // Remove the option at the specified index
    const newOptions = currentOptions.filter((_, index) => index !== optionId)

    // Update the entire options array
    setValue("options", newOptions)

    // Unregister the removed fields
    unregister(`options.${optionId}.text`)
    unregister(`options.${optionId}.forecast`)

    // Clear errors for the removed option and any subsequent options
    for (let i = optionId; i < currentOptions.length; i++) {
      clearErrors(`options.${i}`)
    }

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
