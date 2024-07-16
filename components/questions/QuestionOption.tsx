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
          className="btn h-12 px-2 py-1 bg-red-500 text-white hover:bg-red-600 transition-colors self-end hover:scale-105 text-lg font-normal"
          type="button"
        >
          Remove
        </button>
      )}
    </div>
  )
}
