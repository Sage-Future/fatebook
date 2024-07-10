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
  setPredictionInputRef: (
    optionId: string,
    node: HTMLInputElement | null,
  ) => void
  onRemove: () => void
  canRemove: boolean
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function QuestionOption({
  small,
  errors,
  register,
  watch,
  handleSubmit,
  onSubmit,
  optionId,
  questionType,
  setPredictionInputRef,
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
    setPredictionInputRef,
  }

  // console.log(register)

  const predictionPercentageInputProps = {
    small,
    errors,
    register,
    watch,
    handleSubmit,
    onSubmit,
    optionId,
    questionType,
    // setPredictionInputRef,
  }

  return (
    <div className="flex flex-row justify-between items-center gap-2">
      <OptionTextInput {...optionTextInputProps} />
      <PredictionPercentageInput {...predictionPercentageInputProps} />
      {canRemove && (
        <button
          onClick={onRemove}
          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          type="button"
        >
          Remove
        </button>
      )}
    </div>
  )
}
