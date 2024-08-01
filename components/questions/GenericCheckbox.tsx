import { UseFormHandleSubmit, UseFormRegister } from "react-hook-form"
import { PredictFormType } from "../Predict"
import { InfoButton } from "../ui/InfoButton"
import { ChangeEvent, KeyboardEvent } from "react"

interface GenericCheckboxProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  register: UseFormRegister<PredictFormType>
  name: keyof PredictFormType
  label: string
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
  helpText?: string
  className?: string
  defaultChecked?: boolean
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}

// TODO: maybe move this to `ui` directory
export function GenericCheckbox({
  register,
  name,
  label,
  handleSubmit,
  onSubmit,
  helpText,
  className,
  defaultChecked,
  onChange,
}: GenericCheckboxProps) {
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
        className="checkbox accent-indigo-500 checked:bg-indigo-500 checked:"
      />
      <label htmlFor={name} className="ml-2 block text-gray-900">
        {label}
        {helpText && (
          <InfoButton className="ml-1 tooltip-right" tooltip={helpText} />
        )}
      </label>
    </div>
  )
}
