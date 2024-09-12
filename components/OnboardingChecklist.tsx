import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { ChevronRightIcon } from "@heroicons/react/24/solid"
import Link from "next/link"
import clsx from "clsx"
import { usePredictForm } from "./predict-form/PredictProvider"
import { api } from "../lib/web/trpc"
import { useDebounce } from "use-debounce"
import { QuestionType } from "@prisma/client"
import { useBrowser } from "../lib/web/utils"
import Confetti from "react-confetti"

type QuestionCategory = "personal" | "projects" | "shared"

const DEBOUNCE_INTERVAL = 500

const personalGoalsBinary = [
  "Will I complete my to-do list today?",
  "Will I be happy I went to <event x>?",
  "Will I spend <n mins> doing <habit y> today?",
]
const personalGoalsMC = [
  "How many items on my to-do list will I get to?",
  "Who will I convince to come to <event x>?",
  "How many mins will I spend doing <habit y>?",
]

const projectsBinary = [
  "Will I publish a blog post this week?",
  "Will I raise more than <x dollars>?",
  "Will the new kitchen be done this month?",
]
const projectsMC = [
  "How many blog posts will I publish this week?",
  "How much money will I raise?",
  "In what month will the new kitchen be done?",
]

const sharedBinary = [
  "Will <client x> hire us again?",
  "Will any of us miss our flight?",
  "Will Taylor Swift get married this year?",
]
const sharedMC = [
  "How many clients will we book this month?",
  "How many of us will miss our flights?",
  "When will Taylor Swift get married?",
]

function GoalSuggestions({
  category,
  isMultipleChoice,
  callback,
}: {
  category: QuestionCategory
  isMultipleChoice: boolean
  callback?: (suggestion: string) => void
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  const { setValue } = usePredictForm()

  useEffect(() => {
    if (category === "personal") {
      setSuggestions(isMultipleChoice ? personalGoalsMC : personalGoalsBinary)
    } else if (category === "projects") {
      setSuggestions(isMultipleChoice ? projectsMC : projectsBinary)
    } else if (category === "shared") {
      setSuggestions(isMultipleChoice ? sharedMC : sharedBinary)
    } else {
      setSuggestions([])
    }
  }, [category, isMultipleChoice])

  return (
    <div className="w-full rounded-b-md flex flex-col items-start gap-2 z-10">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          className="btn justify-start text-neutral-500 font-medium leading-normal w-full text-neutral-800 border-2 border-neutral-300"
          onClick={() => {
            setValue("question", suggestion, {
              shouldTouch: true,
              shouldDirty: true,
              shouldValidate: true,
            })
            callback?.(suggestion)
          }}
        >
          <span className="ml-4">
            <span className="font-semibold mr-2 -ml-4">+</span>
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
        onClick={() => {
          setUserCollapsedState(!isCollapsed)
        }}
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
        className={`overflow-hidden ${
          isCollapsed ? "max-h-0 duration-300" : "max-h-screen duration-500"
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
  const [suggestionClicked, setSuggestionClicked] = useState(false)
  const browser = useBrowser()
  const boundaryRef = useRef<HTMLDivElement>(null)

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
          "btn border-2 shadow-md flex-1 whitespace-nowrap",
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

  const onboardingStage = api.question.getOnboardingStage.useQuery()
  const initialOnboardingStageRef =
    useRef<typeof onboardingStage.data>(undefined)
  if (!initialOnboardingStageRef.current && onboardingStage.data) {
    initialOnboardingStageRef.current = onboardingStage.data
  }

  const { questionType, questionInFocus, watch } = usePredictForm()
  const question = watch("question")

  const isMultipleChoice = questionType === QuestionType.MULTIPLE_CHOICE
  const hasSubmittedQuestion =
    onboardingStage.data === "NO_FORECASTS_ON_OWN_QUESTIONS"

  const predictionPercentage = watch("predictionPercentage")
  const mcqOptions = watch("options")

  const allPredictionValues = !isMultipleChoice
    ? [predictionPercentage]
    : mcqOptions?.map((option) => option.forecast)

  const predictionIsTouched = allPredictionValues?.some((n) => !Number.isNaN(n))

  // Add a delay to these updates to make state changes less visually jarring
  const [questionProbablyWritten] = useDebounce(
    onboardingStage.data === "COMPLETE" ||
      hasSubmittedQuestion ||
      predictionIsTouched ||
      ((question?.length ?? 0) > 5 && !questionInFocus),
    DEBOUNCE_INTERVAL,
    { leading: false, trailing: true },
  )
  const [currentOnboardingStage] = useDebounce(
    onboardingStage.data,
    DEBOUNCE_INTERVAL,
    { leading: false, trailing: true },
  )

  if (
    !initialOnboardingStageRef.current ||
    initialOnboardingStageRef.current === "COMPLETE"
  ) {
    return null
  }

  const isSuccessScreen = currentOnboardingStage === "COMPLETE"

  return (
    <>
      <div className="fixed top-0 left-0 z-50">
        {isSuccessScreen && (
          <Confetti
            confettiSource={(() => {
              const rect = boundaryRef.current?.getBoundingClientRect() || {
                left: 0,
                top: 0,
                width: 0,
                height: 0,
              }
              return {
                x: rect.left,
                y: rect.top,
                w: rect.width,
                h: rect.height,
              }
            })()}
            recycle={false}
            tweenDuration={500}
            numberOfPieces={50}
          />
        )}
      </div>
      <div
        className="w-[400px] p-4 mt-7 bg-indigo-50 border-2 border-neutral-300 rounded-lg shadow-lg"
        ref={boundaryRef}
      >
        {!isSuccessScreen && (
          <div className="prose flex flex-col gap-2">
            <h2 className="font-semibold mb-1">Getting started</h2>
            <CollapsibleSection
              tryCollapse={questionProbablyWritten && !suggestionClicked}
              title={
                <span className={hasSubmittedQuestion ? "line-through" : ""}>
                  1. Write a question
                </span>
              }
            >
              <div className="text-sm text-neutral-500 flex flex-col gap-2 my-2">
                <div>
                  What&apos;s something relevant to your life that you want to
                  predict?
                </div>
                <div>
                  For inspiration, check out{" "}
                  <Link
                    href="/public"
                    target="_blank"
                    className="text-neutral-500 hover:text-neutral-600"
                  >
                    public questions
                  </Link>{" "}
                  or pick a category below.
                </div>
                <div className="flex gap-2 justify-between my-1 overflow-visible">
                  <SelectCategoryButton category="personal">
                    Personal goals
                  </SelectCategoryButton>
                  <SelectCategoryButton category="projects">
                    Projects
                  </SelectCategoryButton>
                  <SelectCategoryButton category="shared">
                    Shared
                  </SelectCategoryButton>
                </div>
                {categorySelected && (
                  <GoalSuggestions
                    category={categorySelected}
                    isMultipleChoice={isMultipleChoice}
                    callback={setSuggestionClicked.bind(null, true)}
                  />
                )}
              </div>
            </CollapsibleSection>
            <CollapsibleSection
              tryCollapse={!questionProbablyWritten}
              title={<span>2. Make a prediction</span>}
            >
              <div className="text-sm text-neutral-500 flex flex-col gap-2 my-2">
                {!hasSubmittedQuestion && (
                  <div>
                    {isMultipleChoice ? (
                      "How likely do you think each option is?"
                    ) : (
                      <>
                        How likely do you think it is that the answer will be{" "}
                        <b className="text-neutral-600">YES</b>?
                      </>
                    )}
                  </div>
                )}
                <div>
                  We&apos;ll remind you to resolve your question{" "}
                  {!isMultipleChoice && !hasSubmittedQuestion && (
                    <>
                      <b className="text-neutral-600">YES</b>,{" "}
                      <b className="text-neutral-600">NO</b>, or{" "}
                      <b className="text-neutral-600">AMBIGUOUS</b>
                    </>
                  )}{" "}
                  on the &quot;Resolve by&quot; date you set.
                </div>
                <div>
                  Once you have resolved a few questions, you can start to
                  understand your track record and use this to make better
                  decisions.
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}
        <div
          className={clsx(
            "prose flex flex-col gap-2 transition-opacity",
            !isSuccessScreen
              ? "max-h-0 opacity-0 duration-0"
              : "opacity-100 duration-1000",
          )}
        >
          <h2 className="font-semibold mb-1">Forecast created!</h2>
          <div className="text-sm text-neutral-500 flex flex-col gap-2">
            We&apos;ll notify you when it&apos;s time to resolve your forecast.
          </div>
          <div className="text-sm text-neutral-500 flex flex-col">
            In the meantime, you can:
            <ul className="list-disc list-inside m-0 pl-2">
              <li>
                Try the{" "}
                <Link
                  href="/extension"
                  className="text-neutral-500 hover:text-neutral-600"
                >
                  {browser} extension
                </Link>
                , to track your predictions instantly around the web
              </li>
              <li>
                Check out{" "}
                <Link
                  href="/public"
                  className="text-neutral-500 hover:text-neutral-600"
                >
                  public questions
                </Link>{" "}
                that others have created
              </li>
              <li>
                Consider adding our{" "}
                <Link
                  href="/for-slack"
                  className="text-neutral-500 hover:text-neutral-600"
                >
                  Slack integration
                </Link>{" "}
                to your workspace
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
