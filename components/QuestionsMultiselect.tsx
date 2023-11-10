import { useState } from 'react'
import Select from 'react-select'
import { api } from '../lib/web/trpc'

export function QuestionsMultiselect({
  questions,
  setQuestions,
  disabled,
  placeholder = "Select questions...",
} : {
  questions: string[],
  setQuestions: (questionIds: string[]) => void
  disabled?: boolean,
  placeholder?: string,
}) {
  const [localSelectedQuestions, setLocalSelectedQuestions] = useState<string[]>(questions)
  const allQuestionsQ = api.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.useQuery({
    limit: 100,
    cursor: 0,
  })
  const allQuestions = allQuestionsQ.data?.items ?? []

  return (
    <div className=''>
      <Select
        value={localSelectedQuestions.map(questionId => {
          const question = allQuestions.find(q => q.id === questionId)
          return { label: question ? question.title : questionId, value: questionId }
        })}
        onChange={(newValue) => {
          const newQuestions = newValue.map(v => v.value)
          setLocalSelectedQuestions(newQuestions)
          setQuestions(newQuestions)
        }}
        options={
          allQuestions.map(question => ({ label: question.title, value: question.id }))
        }
        isMulti={true}
        isLoading={allQuestionsQ.isLoading}
        isDisabled={disabled}
        isClearable={false}
        placeholder={placeholder}
      />
    </div>
  )
}
