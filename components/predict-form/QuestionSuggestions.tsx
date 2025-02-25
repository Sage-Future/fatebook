import { QuestionType } from "@prisma/client"
import { ForwardedRef, forwardRef, useState } from "react"

interface QuestionSuggestionsProps {
  chooseSuggestion: (suggestion: string) => void
  questionType: QuestionType
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const QuestionSuggestions = forwardRef<
  HTMLDivElement,
  QuestionSuggestionsProps
>(({ chooseSuggestion, questionType }, ref: ForwardedRef<HTMLDivElement>) => {
  const binarySuggestions = [
    "Will I write a blog post this week?",
    "Will GPT-5 be released before Jan 2026?",
    "Will volunteering abroad make me all-things-considered happier?",
    "Each day I’ll write down whether I want to leave or stay in my job. After 2 months, will I have chosen ‘leave’ on >30 days?",
    "Will I judge that AI was a major topic of debate in the next US election?",
    "Will I finish my todo list today?",
    "Will our user satisfaction rating exceed 8.0/10?",
    "Will I win my next game of Agricola?",
    "Will Our World in Data report that >5% of global deaths are due to air pollution by 2030?",
    "Will I still be discussing my fear of flying with my therapist in 2026?",
    "If we choose this HR provider, will I think it was a good idea in two month’s time?",
    "Will AMF be funding-constrained this year?",
    "Will I have a child by Jan 2026?",
    "Will my mentor agree that pivoting now was the right choice?",
    "Will I meditate every day this week?",
    "Will the rest of the team prefer this redesign to the current layout?",
    "Will anyone on the animal advocacy forum share evidence that convinces me that abolitionist protests are net-beneficial?",
    "Will >80% of my Twitter followers agree that I should keep the beard?",
    "On December 1st, will Marco, Dawn, and Tina all agree that the biosecurity bill passed without amendments that removed its teeth?",
    "If I survey 40 random Americans online, will our current favourite name be the most popular?",
  ]

  const multipleChoiceSuggestions = [
    "Which AI company will release the next major language model?",
    "How many blog posts will I write this month?",
    "Which aspect of my life will be most improved by volunteering abroad?",
    "After 2 months of daily job satisfaction tracking, what will be my most frequent response?",
    "Which topic will dominate the US election debates?",
    "How many items on my todo list will I complete today?",
    "What will our user satisfaction rating be at the end of the quarter?",
    "Who will win our next game night?",
    "According to Our World in Data, what percentage of global deaths will be due to air pollution by 2030?",
    "What will be the primary focus of my therapy sessions in 2026?",
    "How will our team rate the new HR provider after two months?",
    "Which global health charity will have the highest funding gap this year?",
    "How many children will I have by Jan 2026?",
    "How will my mentor evaluate our recent business pivot?",
    "How many days will I meditate this week?",
    "Which aspect of the new design will receive the most positive feedback from the team?",
    "What type of animal advocacy strategy will gain the most traction on the forum this year?",
    "What percentage of my Twitter followers will prefer my new look?",
    "How will the biosecurity bill be modified before passing?",
    "Which name from our shortlist will be most popular in our survey of 40 random Americans?",
  ]

  const suggestions =
    questionType === QuestionType.MULTIPLE_CHOICE
      ? multipleChoiceSuggestions
      : binarySuggestions

  const [showAll, setShowAll] = useState(false)

  return (
    <div
      ref={ref}
      className="w-full bg-white shadow-inner rounded-b-md px-6 pt-4 pb-6 mb-6 flex flex-col items-start gap-2 z-10"
    >
      <h4 className="select-none pl-4">{"Here are a few ideas..."}</h4>
      {suggestions.slice(0, showAll ? undefined : 8).map((suggestion) => (
        <button
          key={suggestion}
          className="btn btn-ghost text-left text-neutral-500 font-normal leading-normal"
          onClick={(e) => {
            chooseSuggestion(suggestion)
            e.preventDefault()
          }}
        >
          <span className="ml-4">
            <span className="text-neutral-500 font-semibold mr-2 -ml-4">+</span>
            <span>{suggestion}</span>
          </span>
        </button>
      ))}
      {!showAll && (
        <button
          className="btn"
          onClick={(e) => {
            e.preventDefault()
            setShowAll(true)
          }}
        >
          Show more
        </button>
      )}
    </div>
  )
})

QuestionSuggestions.displayName = "QuestionSuggestions"

export default QuestionSuggestions
