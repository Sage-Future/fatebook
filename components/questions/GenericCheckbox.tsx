import clsx from "clsx"
import { ChangeEvent, KeyboardEvent } from "react"
import { useFormContext } from "react-hook-form"
import { PredictFormType } from "../Predict"
import { InfoButton } from "../ui/InfoButton"

// TODO: maybe move this to `ui` directory
export function GenericCheckbox({
  name,
  label,
  onSubmit,
  helpText,
  className,
  defaultChecked,
  onChange,
  labelClassName,
}: {
  name: keyof PredictFormType
  label: string
  onSubmit: (data: any) => void
  helpText?: string
  className?: string
  defaultChecked?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  labelClassName?: string
}) {
  const { register, handleSubmit } = useFormContext<PredictFormType>()

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        onKeyDown={onEnterSubmit}
        id={name}
        defaultChecked={defaultChecked}
        {...register(name)}
        onChange={onChange}
        className="checkbox accent-indigo-500 checked:bg-indigo-500"
      />
      <label
        htmlFor={name}
        className={clsx("ml-2 block text-neutral-900", labelClassName)}
      >
        {label}
      </label>
      {helpText && (
        <InfoButton
          className="ml-1 tooltip-right flex items-center"
          tooltip={helpText}
        />
      )}
    </div>
  )
}
