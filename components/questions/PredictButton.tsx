import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
  useWatch,
} from "react-hook-form"
import { useEffect, useState } from "react"
import { PredictFormType } from "../Predict"

interface PredictButtonsProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  userId?: string
  onSubmit: (data: any) => void
  session: { status: string }
  errors: FieldErrors<any>
  handleSubmit: UseFormHandleSubmit<TFormValues>
  clearErrors: UseFormClearErrors<any>
  control: Control<PredictFormType>
}

export function PredictButton({
  userId,
  onSubmit,
  session,
  errors,
  handleSubmit,
  clearErrors,
  control,
}: PredictButtonsProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formState, setFormState] = useState({})

  // Watch for changes in the form
  const watchedFields = useWatch({ control })

  useEffect(() => {
    if (JSON.stringify(watchedFields) !== JSON.stringify(formState)) {
      setShowErrors(false)
      clearErrors()
      setFormState(watchedFields)
    }
  }, [watchedFields, formState, clearErrors])

  // Gather all errors into a single message
  useEffect(() => {
    const errorMessages = Object.values(errors).map((err) => err?.root?.message)
    errorMessages.push(...Object.values(errors).map((err) => err?.message))

    if (errors.options) {
      errorMessages.push(
        ...Object.values(errors.options).map((err) => err?.text?.message),
      )
    }

    // Formats error message - removes duplicates, trims whitespace, and lowercases
    const newErrorMessage = Array.from(
      new Set(
        errorMessages
          .filter((item) => item !== undefined && item !== null)
          .map((item) => {
            try {
              return String(item).trim().toLowerCase()
            } catch {
              return ""
            }
          })
          .filter((str) => str.length > 0),
      ),
    ).join(", ")

    setErrorMessage(
      newErrorMessage.charAt(0).toUpperCase() +
        newErrorMessage.slice(1).toLowerCase(),
    )
  }, [errors, showErrors])

  return (
    <div className="grid grid-cols-1-3-1">
      <div>
        {showErrors && errorMessage && (
          <span className="text-red-500 text-sm mt-2">{errorMessage}</span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault()
          void handleSubmit(onSubmit)(e)
          setShowErrors(true)
        }}
        className="btn btn-primary btn-lg hover:scale-105 h-12 max-w-28"
        disabled={!!userId && Object.values(errors).some((err) => !!err)}
      >
        {userId || session.status === "loading"
          ? "Predict"
          : "Sign up to predict"}
      </button>
    </div>
  )
}
