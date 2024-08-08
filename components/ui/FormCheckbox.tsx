import clsx from "clsx"
import { ChangeEvent, KeyboardEvent } from "react"
import { useFormContext } from "react-hook-form"
import { PredictFormType } from "../predict-form/Predict"
import { InfoButton } from "./InfoButton"

export function FormCheckbox({
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

  const registered = register(name)

  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        onKeyDown={onEnterSubmit}
        id={name}
        defaultChecked={defaultChecked}
        {...registered}
        onChange={(e) => {
          void registered.onChange?.(e)
          onChange?.(e)
        }}
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
