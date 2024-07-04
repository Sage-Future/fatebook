import {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form"
import React from "react"

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
  register: UseFormRegister<any>
  setValue: UseFormSetValue<any>
  errors: FieldErrors<any>
  watch: (name: string) => any
  handleSubmit: UseFormHandleSubmit<TFormValues>
  textAreaRef?: React.RefObject<HTMLTextAreaElement>
  highlightResolveBy: boolean
}
