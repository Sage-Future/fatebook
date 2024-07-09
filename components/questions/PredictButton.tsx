import { FieldErrors, UseFormHandleSubmit } from "react-hook-form"

interface PredictButtonsProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  userId?: string
  onSubmit: (data: any) => void
  session: { status: string }
  errors: FieldErrors<any>
  handleSubmit: UseFormHandleSubmit<TFormValues>
}

export function PredictButton({
  userId,
  onSubmit,
  session,
  errors,
  handleSubmit,
}: PredictButtonsProps) {
  // console.log(errors)
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        void handleSubmit(onSubmit)(e)
      }}
      className="btn btn-primary btn-lg hover:scale-105"
      disabled={!!userId && Object.values(errors).some((err) => !!err)}
    >
      {userId || session.status === "loading"
        ? "Predict"
        : "Sign up to predict"}
    </button>
  )
}
