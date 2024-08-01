import React from "react"
import { UseFormRegister, UseFormHandleSubmit } from "react-hook-form"
import { GenericCheckbox } from "./GenericCheckbox"
import { PredictFormType } from "../Predict"

interface EmbeddedOptionsProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  register: UseFormRegister<PredictFormType>
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
}

export function EmbeddedOptions({
  register,
  handleSubmit,
  onSubmit,
}: EmbeddedOptionsProps) {
  const [isChecked, setIsChecked] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("lastSharedPubliclyState") === "true",
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckedState = e.target.checked
    setIsChecked(newCheckedState)
    localStorage.setItem(
      "lastSharedPubliclyState",
      newCheckedState ? "true" : "false",
    )
  }

  return (
    <GenericCheckbox
      register={register}
      name="sharePublicly"
      label="Share with anyone with the link?"
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      helpText="If checked, anyone with the link can view this prediction."
      defaultChecked={isChecked}
      onChange={handleChange}
    />
  )
}
