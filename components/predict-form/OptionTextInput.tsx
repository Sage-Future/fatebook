import clsx from "clsx"
import { KeyboardEvent } from "react"
import { useFormContext } from "react-hook-form"
import { InfoButton } from "../ui/InfoButton"
import { PredictFormType } from "./PredictProvider"

interface OptionTextInputProps {
  optionId: number
  index: number
  small?: boolean
  onSubmit: (data: any) => void
}

export function OptionTextInput({
  optionId,
  index,
  small = false,
  onSubmit,
}: OptionTextInputProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext<PredictFormType>()

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  return (
    <div className="w-44">
      {index == 0 && (
        <label
          className={clsx("flex", small && "text-sm")}
          htmlFor={`options.${optionId}.text`}
        >
          Options
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
          "w-full px-3 py-2 text-neutral-700 rounded-lg focus:outline-none border-2 border-neutral-300 h-12",
          small ? "text-sm" : "text-base",
          errors.options?.[optionId]?.text
            ? "border-red-500"
            : "border-neutral-300 focus-within:border-indigo-700",
        )}
        type="text"
        placeholder={`Option ${index + 1}`}
        onKeyDown={onEnterSubmit}
      />
    </div>
  )
}
