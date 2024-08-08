import { UseFormHandleSubmit } from "react-hook-form"

export const onEnterSubmit = (
  e: KeyboardEvent,
  onSubmit: (data: any) => void,
  handleSubmit: UseFormHandleSubmit<Record<string, any>>,
) => {
  if (e.key === "Enter") {
    void handleSubmit(onSubmit)()
    e.preventDefault()
    return true
  }
}
