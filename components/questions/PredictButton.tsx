import {
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
} from "react-hook-form"
import { useEffect, useState } from "react"

interface PredictButtonsProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  userId?: string
  onSubmit: (data: any) => void
  session: { status: string }
  errors: FieldErrors<any>
  handleSubmit: UseFormHandleSubmit<TFormValues>
  clearErrors: UseFormClearErrors<any>
}

export function PredictButton({
  userId,
  onSubmit,
  session,
  errors,
  handleSubmit,
  clearErrors,
}: PredictButtonsProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  console.log(errors)
  // Gather all errors into a single message
  useEffect(() => {
    const newErrorMessage = Object.values(errors)
      .map((err) => err?.root?.message)
      .join(", ")
    setErrorMessage(newErrorMessage)
    console.log(newErrorMessage)
  }, [errors])

  return (
    <div>
      <button
        onClick={(e) => {
          e.preventDefault()
          void handleSubmit(onSubmit)(e)
          setShowErrors(true)
          // This is absolutely disgusting and you should change it
          setTimeout(() => {
            clearErrors()
            setShowErrors(false)
          }, 2000)
        }}
        className="btn btn-primary btn-lg hover:scale-105"
        disabled={!!userId && Object.values(errors).some((err) => !!err)}
      >
        {userId || session.status === "loading"
          ? "Predict"
          : "Sign up to predict"}
      </button>
      {showErrors && errorMessage && (
        <span className="text-red-500 text-sm mt-2">{errorMessage}</span>
      )}
    </div>
  )
}
