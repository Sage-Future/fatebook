import React from "react"
import { FormCheckbox } from "../ui/FormCheckbox"

export function EmbeddedOptions({
  onSubmit,
}: {
  onSubmit: (data: any) => void
}) {
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
    <FormCheckbox
      name="sharePublicly"
      label="Share with anyone with the link?"
      onSubmit={onSubmit}
      helpText="If checked, anyone with the link can view this prediction."
      defaultChecked={isChecked}
      onChange={handleChange}
    />
  )
}
