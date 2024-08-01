import {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form"
import { PredictFormType } from "../../Predict"

// eslint-disable-next-line no-unused-vars
interface QuestionTypeProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  resolveByButtons?: { date: Date; label: string }[]
  questionDefaults?: {
    title?: string
    tournamentId?: string
    resolveBy?: Date
    shareWithListIds?: string[]
    sharePublicly?: boolean
    unlisted?: boolean
  }
  embedded?: boolean
  userId?: string
  onSubmit: (data: any) => void
  signInToFatebook: () => Promise<void>
  session: { status: string }
  register: UseFormRegister<PredictFormType>
  setValue: UseFormSetValue<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<TFormValues>
  handleSubmit: UseFormHandleSubmit<TFormValues>
  clearErrors: UseFormClearErrors<any>
  highlightResolveBy: boolean
  control: Control<PredictFormType>
}
