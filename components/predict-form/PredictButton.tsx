import { useSession } from "next-auth/react"
import { useFormContext, useFormState } from "react-hook-form"
import { capitalizeFirstLetter } from "../../lib/_utils_common"
import { useUserId } from "../../lib/web/utils"
import { PredictFormType } from "./PredictProvider"

export function PredictButton({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { handleSubmit } = useFormContext<PredictFormType>()
  const { errors } = useFormState<PredictFormType>()

  const session = useSession()
  const userId = useUserId()

  // // Gather all errors into a single message
  const errorMessages = Object.values(errors).map((err) => err?.root?.message)
  errorMessages.push(...Object.values(errors).map((err) => err?.message))

  if (errors.options) {
    errorMessages.push(
      ...Object.values(errors.options).flatMap((err) => {
        if (typeof err === "object" && err !== null) {
          return Object.values(err).map((nestedErr) => {
            if (typeof nestedErr === "object" && nestedErr !== null) {
              if ("message" in nestedErr) {
                return nestedErr.message
              }
              if ("text" in nestedErr) {
                return nestedErr.text
              }
            }
          })
        }
        return String(err)
      }),
    )
  }

  const HIDDEN_ERRORS = ["question is required"]

  // Formats error message - removes duplicates, trims whitespace, and lowercases
  const errorMessage = capitalizeFirstLetter(
    Array.from(
      new Set(
        errorMessages
          .filter(
            (item) =>
              item &&
              !HIDDEN_ERRORS.some(
                (err) => item?.toLowerCase() === err.toLowerCase(),
              ),
          )
          .map((item) => {
            try {
              return String(item).trim().toLowerCase()
            } catch {
              return ""
            }
          })
          .filter((str) => str.length > 0)
          .slice(0, 1), // only show the first error
      ),
    ).join(", "),
  )

  return (
    <div className="grid grid-cols-1-3-1 relative">
      <button
        onClick={(e) => {
          e.preventDefault()
          void handleSubmit(onSubmit)(e)
        }}
        className="btn btn-primary btn-lg hover:scale-105 h-12"
        disabled={!!userId && Object.values(errors).some((err) => !!err)}
      >
        {userId || session.status === "loading"
          ? "Predict"
          : "Sign up to predict"}
      </button>
      <span className="text-xs absolute translate-y-full text-right pt-0.5 bottom-0 right-0 italic text-red-600">
        {errorMessage}
      </span>
    </div>
  )
}
