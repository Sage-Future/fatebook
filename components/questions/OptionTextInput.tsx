import { KeyboardEvent } from "react"
import { UseFormHandleSubmit, UseFormRegister } from "react-hook-form"
import clsx from "clsx"
import { PredictFormType } from "../Predict"
import { InfoButton } from "../ui/InfoButton"

interface OptionTextInputProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  optionId: number
  index: number
  register: UseFormRegister<PredictFormType>
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
  small?: boolean
  errors: Record<string, any>
}

export function OptionTextInput({
  optionId,
  index,
  register,
  handleSubmit,
  onSubmit,
  small = false,
  errors,
}: OptionTextInputProps) {
  const fieldName = `options.${optionId}.text`

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  return (
    <div className="">
      {index == 0 && (
        <label
          className={clsx("flex", small && "text-sm")}
          htmlFor={`options.${optionId}.text`}
        >
          Answers
          <InfoButton
            className="ml-1 tooltip-left"
            tooltip="What possible outcomes are there?"
          />
        </label>
      )}
      <input
        {...register(`options.${optionId}.text`, {
          required: "Option text is required",
        })}
        className={clsx(
          "w-full px-3 py-2 text-gray-700 rounded-lg focus:outline-none border-2 border-neutral-300 h-12",
          small ? "text-sm" : "text-base",
          errors[fieldName]
            ? "border-red-500"
            : "border-gray-300 focus-within:border-indigo-700",
        )}
        type="text"
        placeholder={`Option ${index + 1}`}
        onKeyDown={onEnterSubmit}
      />
      {errors[fieldName] && (
        <p className="mt-1 text-xs text-red-500">{errors[fieldName].message}</p>
      )}
    </div>
  )
}