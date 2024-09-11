// When to show:
// - When the user has 0 questions and 0 forecasts on questions _they have created_

// TODO:
// - [ ] Check style consistency

import { useEffect, useState } from "react"
import { ChevronRightIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import clsx from "clsx"

type QuestionCategory = "personal" | "projects" | "shared"

export function OnboardingChecklist() {
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false)
  const [isPredictionCollapsed, setIsPredictionCollapsed] = useState(true)
  const [categorySelected, setCategorySelected] =
    useState<QuestionCategory | null>(null)

  const isSuccessScreen =
    new URLSearchParams(window.location.search).get("success") === "true"

  return (
    // TODO avoid negative margin
    <div className="bg-indigo-50 p-4 rounded-lg border-2 border-neutral-300 shadow-lg prose max-w-[400px] w-full mt-[-22px]">
      {!isSuccessScreen ? (
        <>
          <h2 className="font-semibold mb-4">Getting started</h2>
          <div className="mb-2">
            <div
              className="flex items-center font-semibold text-black select-none w-fit mb-2"
              onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)}
              role="button"
              tabIndex={0}
              aria-expanded={!isQuestionCollapsed}
            >
              <ChevronRightIcon
                className={`w-5 h-5 mr-2 transition-transform duration-200 ${
                  isQuestionCollapsed ? "rotate-0" : "rotate-90"
                }`}
              />
              1. Write a question
            </div>
            <div
              className={`duration-100 overflow-hidden ${
                // TODO fixed height required here, try to avoid that
                isQuestionCollapsed ? "max-h-0" : "max-h-120"
              }`}
            >
              <div className="text-sm text-neutral-500 flex flex-col gap-2 mb-2">
                {/* TODO maybe cut this line */}
                <div>
                  What is something relevant to your life that you&apos;re not
                  sure about?
                </div>
                <div>
                  You could try looking at{" "}
                  <Link
                    href="/public"
                    target="_blank"
                    className="text-neutral-500 hover:text-neutral-600"
                  >
                    public questions
                  </Link>{" "}
                  for inspiration, or pick a question from one of the categories
                  below.
                </div>
                <div className="flex gap-2 justify-between my-1 overflow-visible">
                  <button
                    className={clsx(
                      "btn border-2 shadow-md",
                      categorySelected === "personal"
                        ? "btn-primary"
                        : "border-neutral-300",
                    )}
                    onClick={() =>
                      setCategorySelected(
                        categorySelected === "personal" ? null : "personal",
                      )
                    }
                  >
                    Personal goals
                  </button>
                  <button
                    className={clsx(
                      "btn border-2 shadow-md",
                      categorySelected === "projects"
                        ? "btn-primary"
                        : "border-neutral-300",
                    )}
                    onClick={() =>
                      setCategorySelected(
                        categorySelected === "projects" ? null : "projects",
                      )
                    }
                  >
                    Projects
                  </button>
                  <button
                    className={clsx(
                      "btn border-2 shadow-md",
                      categorySelected === "shared"
                        ? "btn-primary"
                        : "border-2 border-neutral-300",
                    )}
                    onClick={() =>
                      setCategorySelected(
                        categorySelected === "shared" ? null : "shared",
                      )
                    }
                  >
                    For friends
                  </button>
                </div>
                {categorySelected && (
                  <GoalSuggestions
                    category={categorySelected}
                    chooseSuggestion={() => {}}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <div
              className="flex items-center font-semibold text-black select-none w-fit mb-2"
              onClick={() => setIsPredictionCollapsed(!isPredictionCollapsed)}
              role="button"
              tabIndex={0}
              aria-expanded={!isPredictionCollapsed}
            >
              <ChevronRightIcon
                className={`w-5 h-5 mr-2 transition-transform duration-100 ${
                  isPredictionCollapsed ? "rotate-0" : "rotate-90"
                }`}
              />
              2. Make a prediction
            </div>
            <div
              className={`duration-100 overflow-hidden ${
                isPredictionCollapsed ? "max-h-0" : "max-h-40"
              }`}
            >
              <div className="text-sm text-neutral-500 flex flex-col gap-2 mb-2">
                <div>
                  Estimate the probability that the answer is{" "}
                  <b className="text-neutral-600">YES</b>.
                </div>
                <div>
                  We&apos;ll remind you to resolve your question on the
                  &quot;Resolve by&quot; date you set.
                </div>
                <div>
                  Once you have resolved a few questions, you can start to
                  understand your track record and use this to make better
                  decisions.
                </div>
                {/* <div>
              You will get an email reminding you to resolve your question on
              the &quot;Resolve by&quot; date you set.
            </div> */}
                {/* <div>
              Once you have resolved a few questions you will be able to see
              your track record and understand where you can improve.
            </div> */}
                {/* <div>
              [TODO link to a good resource on the basics of forecasting?]
            </div> */}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-semibold mb-4">Question created!</h2>
          <div className="text-sm text-neutral-500 flex flex-col gap-2 mb-2">
            Some text relating to this, which is enough to push it to it&apos;s
            full available width
          </div>
        </>
      )}
    </div>
  )
}

interface GoalSuggestionsProps {
  category: "personal" | "projects" | "shared"
  chooseSuggestion: (suggestion: string) => void
}

const personalGoals = [
  "Will I complete my to-do list today?",
  "Will I be happy I went to <event x>?",
  "Will I spend <n mins> doing <habit y> today?",
]

const projects = [
  "Complete the website redesign",
  "Launch the new marketing campaign",
  "Develop a new feature for the app",
]

const forFriends = [
  "Organize a surprise party",
  "Plan a weekend getaway",
  "Create a photo album",
]

function GoalSuggestions({ category, chooseSuggestion }: GoalSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (category === "personal") {
      setSuggestions(personalGoals)
    } else if (category === "projects") {
      setSuggestions(projects)
    } else if (category === "shared") {
      setSuggestions(forFriends)
    } else {
      setSuggestions([])
    }
  }, [category])

  return (
    <div className="w-full rounded-b-md flex flex-col items-start gap-2 z-10">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          className="btn justify-start text-neutral-500 font-normal leading-normal w-full"
          onClick={() => chooseSuggestion(suggestion)}
        >
          <span className="ml-4">
            <span className="text-neutral-500 font-semibold mr-2 -ml-4">+</span>
            <span>{suggestion}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export default GoalSuggestions
