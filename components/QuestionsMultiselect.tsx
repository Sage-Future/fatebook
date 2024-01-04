import { useState } from "react"
import Select from "react-select"
import { api } from "../lib/web/trpc"

export function QuestionsMultiselect({
  questions,
  setQuestions,
  disabled,
  placeholder = "Select questions...",
  includeTournamentQuestions,
}: {
  questions: string[]
  setQuestions: (questionIds: string[]) => void
  disabled?: boolean
  placeholder?: string
  includeTournamentQuestions?: string
}) {
  const [localSelectedQuestions, setLocalSelectedQuestions] =
    useState<string[]>(questions)
  const allQuestionsQ =
    api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery({
      limit: 10000,
      cursor: 0,
    })
  const currentTournamentQuestionsQ =
    api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery({
      limit: 10000,
      cursor: 0,
      extraFilters: {
        filterTournamentId: includeTournamentQuestions,
      },
    })
  const allQuestions = [
    ...(allQuestionsQ.data?.items || []),
    ...(currentTournamentQuestionsQ.data?.items || []),
  ]

  return (
    <div className="">
      <Select
        value={localSelectedQuestions.map((questionId) => {
          const question = allQuestions.find((q) => q.id === questionId)
          return {
            label: question ? question.title : "Loading...",
            value: questionId,
          }
        })}
        onChange={(newValue) => {
          const newQuestions = newValue.map((v: any) => v.value)
          setLocalSelectedQuestions(newQuestions)
          setQuestions(newQuestions)
        }}
        options={allQuestions.map((question) => ({
          label: question.title,
          value: question.id,
        }))}
        isMulti={true}
        isLoading={allQuestionsQ.isLoading}
        isDisabled={disabled}
        isClearable={false}
        placeholder={placeholder}
      />
    </div>
  )
}
