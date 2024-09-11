// When to show:
// - When the user has 0 questions and 0 forecasts on questions _they have created_

// TODO:
// - [X] De-dup some components
// - [ ] Check style consistency
//

import { ReactNode, useCallback, useEffect, useState } from "react"
import { ChevronRightIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import clsx from "clsx"
import { usePredictForm } from "./predict-form/PredictProvider"

type QuestionCategory = "personal" | "projects" | "shared"

interface GoalSuggestionsProps {
  category: QuestionCategory
}

const personalGoals = [
  "Will I complete my to-do list today?",
  "Will I be happy I went to <event x>?",
  "Will I spend <n mins> doing <habit y> today?",
]

// TODO come up with better examples for these two groups
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

function GoalSuggestions({ category }: GoalSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  const { setValue } = usePredictForm()

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

  // TODO reuse styles from elsewhere if possible
  // TODO change colour to look less greyed out
  return (
    <div className="w-full rounded-b-md flex flex-col items-start gap-2 z-10">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          className="btn justify-start text-neutral-500 font-normal leading-normal w-full"
          onClick={() => {
            setValue("question", suggestion, {
              shouldTouch: true,
              shouldDirty: true,
              shouldValidate: true,
            })
          }}
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

/**
 * @param {boolean} props.tryCollapse - Controls whether the section is collapsed, unless the user has manually toggled the state
 */
function CollapsibleSection({
  tryCollapse,
  title,
  children,
}: {
  tryCollapse: boolean
  title: ReactNode
  children: ReactNode
}) {
  const [userCollapsedState, setUserCollapsedState] = useState<boolean | null>(
    null,
  )

  const isCollapsed = userCollapsedState ?? tryCollapse

  return (
    <div>
      <div
        className="flex items-center font-semibold text-black select-none w-fit"
        onClick={() => setUserCollapsedState(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
      >
        <ChevronRightIcon
          className={`w-5 h-5 mr-2 transition-transform duration-200 ${
            isCollapsed ? "rotate-0" : "rotate-90"
          }`}
        />
        {title}
      </div>
      <div
        className={`duration-100 overflow-hidden ${
          isCollapsed ? "max-h-0" : "max-h-screen"
        }`}
      >
        {children}
      </div>
    </div>
  )
}

export function OnboardingChecklist() {
  const [categorySelected, setCategorySelected] =
    useState<QuestionCategory | null>(null)

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const SelectCategoryButton = useCallback(
    ({
      category,
      children,
    }: {
      category: QuestionCategory
      children: ReactNode
    }) => (
      <button
        className={clsx(
          "btn border-2 shadow-md",
          categorySelected === category ? "btn-primary" : "border-neutral-300",
        )}
        onClick={() =>
          setCategorySelected(categorySelected === category ? null : category)
        }
      >
        {children}
      </button>
    ),
    [categorySelected],
  )

  // TODO remove, this is here for debugging
  const isSuccessScreen =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("success") === "true"

  return (
    <div className="prose flex flex-col gap-2 w-[400px] p-4 mt-7 bg-indigo-50 border-2 border-neutral-300 rounded-lg shadow-lg">
      {!isSuccessScreen && (
        <>
          <h2 className="font-semibold mb-1">Getting started</h2>
          <CollapsibleSection tryCollapse={false} title={"1. Write a question"}>
            <div className="text-sm text-neutral-500 flex flex-col gap-2 my-2">
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
                <SelectCategoryButton category="personal">
                  Personal goals
                </SelectCategoryButton>
                <SelectCategoryButton category="projects">
                  Projects
                </SelectCategoryButton>
                <SelectCategoryButton category="shared">
                  For friends
                </SelectCategoryButton>
              </div>
              {categorySelected && (
                <GoalSuggestions category={categorySelected} />
              )}
            </div>
          </CollapsibleSection>
          <CollapsibleSection tryCollapse={true} title={"2. Make a prediction"}>
            <div className="text-sm text-neutral-500 flex flex-col gap-2 my-2">
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
            </div>
          </CollapsibleSection>
        </>
      )}
      {isSuccessScreen && (
        <>
          <h2 className="font-semibold mb-1">Success!</h2>
          <div className="text-sm text-neutral-500 flex flex-col gap-2 mb-2">
            Some text relating to this, which is enough to push it to it&apos;s
            full available width
          </div>
        </>
      )}
    </div>
  )
}
