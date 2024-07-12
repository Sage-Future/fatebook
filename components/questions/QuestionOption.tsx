import {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form"
import { PredictionPercentageInput } from "./PredictionPercentageInput"
import { OptionTextInput } from "./OptionTextInput"
import { PredictFormType } from "../Predict"
import { QuestionType } from "@prisma/client"

interface QuestionOptionProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  errors: FieldErrors<any>
  register: UseFormRegister<PredictFormType>
  watch: (name: string) => any
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
  optionId: number
  questionType: QuestionType
  onRemove: () => void
  canRemove: boolean
}

export function QuestionOption({
  small,
  errors,
  register,
  watch,
  handleSubmit,
  onSubmit,
  optionId,
  questionType,
  onRemove,
  canRemove,
}: QuestionOptionProps) {
  const optionTextInputProps = {
    optionId,
    register,
    small,
    errors,
    handleSubmit,
    onSubmit,
  }

  const predictionPercentageInputProps = {
    small,
    errors,
    register,
    watch,
    handleSubmit,
    onSubmit,
    optionId,
    questionType,
  }

  return (
    <div className="flex flex-row justify-between items-center gap-2">
      <OptionTextInput {...optionTextInputProps} />
      <PredictionPercentageInput {...predictionPercentageInputProps} />
      {canRemove && (
        <button
          onClick={onRemove}
          className="btn h-12 px-2 py-1 bg-red-500 text-white hover:bg-red-600 transition-colors self-end hover:scale-105 text-lg font-normal"
          type="button"
        >
          Remove
        </button>
      )}
    </div>
  )
}
