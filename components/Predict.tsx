import { Transition } from "@headlessui/react"
import { LightBulbIcon } from "@heroicons/react/24/solid"
import { zodResolver } from "@hookform/resolvers/zod"
import * as chrono from "chrono-node"
import clsx from "clsx"
import { useSession } from "next-auth/react"
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { ErrorBoundary } from "react-error-boundary"
import { SubmitHandler, useForm, UseFormReturn } from "react-hook-form"
import { mergeRefs } from "react-merge-refs"
import TextareaAutosize from "react-textarea-autosize"
import SuperJSON from "trpc-transformer"
import { z } from "zod"
import { getDateYYYYMMDD, tomorrowDate } from "../lib/_utils_common"
import { api } from "../lib/web/trpc"
import { signInToFatebook, utcDateStrToLocalDate } from "../lib/web/utils"
import { fatebookUrl } from "../lib/_constants"
import BinaryQuestion from "./questions/question-types/BinaryQuestion"
import { QuestionType } from "@prisma/client"
import MultiChoiceQuestion from "./questions/question-types/MultiChoiceQuestion"
import { QuestionTypeSelect } from "./questions/QuestionTypeSelect"
import QuestionSuggestions from "./questions/QuestionSuggestions"

type CreateQuestionMutationOutput = NonNullable<
  ReturnType<typeof api.question.create.useMutation>["data"]
>

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  forecast: z.preprocess(
    (val) => (typeof val === "string" ? parseFloat(val) : val),
    z.number().min(0).max(100, "Forecast must be between 0 and 100"),
  ),
})

// const multiChoicePredictFormSchema = z.object({
//   question: z.string().min(1, "Question is required"),
//   resolveBy: z.string(),
//   options: z
//     .array(optionSchema)
//     .min(2, "At least two options are required")
//     .max(10, "Maximum 10 options allowed")
//     .refine(
//       (options) => {
//         let totalForecast = 0
//         options.forEach((option, index) => {
//           const forecast = isNaN(option.forecast)
//             ? 0
//             : Number(option.forecast)
//           totalForecast += forecast
//         })
//         return Math.abs(totalForecast - 100) < 0.01
//       },
//       {
//         message: "The sum of all forecasts must equal 100%",
//       },
//     ),
//   sharePublicly: z.boolean().optional(),
// })

// Create a unified schema
// const unifiedPredictFormSchema = z.union([
//   binaryPredictFormSchema,
//   multiChoicePredictFormSchema,
// ])

const unifiedPredictFormSchema = z.object({
  question: z.string().min(1, "Question is required"),
  resolveBy: z.string(),
  options: z
    .array(optionSchema)
    .min(2, "At least two options are required")
    .max(10, "Maximum 10 options allowed")
    .refine(
      (options) => {
        let totalForecast = 0
        options.forEach((option) => {
          const forecast = isNaN(option.forecast) ? 0 : Number(option.forecast)
          totalForecast += forecast
        })
        return totalForecast <= 100
      },
      {
        message: "The sum of all forecasts cannot exceed 100%",
      },
    )
    .optional(),
  predictionPercentage: z.number().min(0).max(100).or(z.nan()).optional(),
  sharePublicly: z.boolean().optional(),
})

export type PredictFormType = z.infer<typeof unifiedPredictFormSchema>

interface QuestionDefaults {
  title?: string
  tournamentId?: string
  resolveBy?: Date
  shareWithListIds?: string[]
  sharePublicly?: boolean
  unlisted?: boolean
}

interface PredictProps {
  questionDefaults?: QuestionDefaults
  textAreaRef?: React.RefObject<HTMLTextAreaElement>
  onQuestionCreate?: (output: CreateQuestionMutationOutput) => void
  embedded?: boolean
  resetTrigger?: boolean
  setResetTrigger?: (arg: boolean) => void
  resolveByButtons?: { date: Date; label: string }[]
  showQuestionSuggestionsButton?: boolean
  placeholder?: string
  small?: boolean
  smartSetDates?: boolean
}

export function Predict({
  questionDefaults,
  textAreaRef,
  onQuestionCreate,
  embedded,
  resetTrigger,
  setResetTrigger,
  resolveByButtons,
  showQuestionSuggestionsButton = true,
  placeholder,
  small,
  smartSetDates = true,
}: PredictProps) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    QuestionType.BINARY,
  )

  const nonPassedRef = useRef(null) // ref must be created every time, even if not always used
  textAreaRef = textAreaRef || nonPassedRef

  // TODO: move this somewhere else
  function usePredictForm(
    questionType: QuestionType,
  ): UseFormReturn<PredictFormType> & {
    setQuestionType: (type: QuestionType) => void
  } {
    const form = useForm<PredictFormType>({
      mode: "all",
      resolver: zodResolver(unifiedPredictFormSchema),
    })

    const setQuestionType = useCallback(
      (newType: QuestionType) => {
        const currentValues = form.getValues()
        if (newType === QuestionType.MULTIPLE_CHOICE) {
          form.reset(
            {
              ...currentValues,
              options: currentValues.options?.length
                ? currentValues.options
                : [
                    { text: "", forecast: NaN },
                    { text: "", forecast: NaN },
                  ],
              predictionPercentage: undefined,
            },
            { keepDefaultValues: true },
          )
        } else {
          form.reset(
            {
              ...currentValues,
              predictionPercentage: currentValues.predictionPercentage ?? NaN,
              options: undefined,
            },
            { keepDefaultValues: true },
          )
        }
      },
      [form],
    )

    useEffect(() => {
      setQuestionType(questionType)
    }, [questionType, setQuestionType])

    return { ...form, setQuestionType }
  }

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    watch,
    reset,
    setFocus,
    formState: { dirtyFields, errors },
  } = usePredictForm(questionType)

  const question = watch("question")
  const resolveByUTCStr = watch(
    "resolveBy",
    getDateYYYYMMDD(questionDefaults?.resolveBy || tomorrowDate()),
  )

  const session = useSession()
  const userId = session.data?.user.id
  const utils = api.useContext()
  const createQuestion = api.question.create.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate(
        {},
        {
          refetchPage: (lastPage, index) => index === 0, // assumes the new question is on the first page (must be ordered by recent)
        },
      )
      await utils.question.getForecastCountByDate.invalidate()
      if (questionDefaults?.tournamentId) {
        await utils.tournament.get.invalidate({
          id: questionDefaults.tournamentId,
        })
      }
    },
  })

  const [tagsPreview, setTagsPreview] = useState<string[]>([])
  const onSubmit: SubmitHandler<PredictFormType> = useCallback(
    (data, e) => {
      console.log(data)
      e?.preventDefault() // don't reload the page

      if (!userId) {
        localStorage.setItem(
          "cached_question_content",
          SuperJSON.stringify(data),
        )
        if (embedded) {
          window.open(fatebookUrl, "_blank")?.focus()
        } else {
          void signInToFatebook()
        }
        return
      }

      if (Object.values(errors).some((err) => !!err)) return

      const questionWithoutTags = data.question.replace(/#\w+/g, "").trim()
      const isMultiChoice = "options" in data && data.options

      const createQuestionData = {
        title: questionWithoutTags || data.question,
        resolveBy: utcDateStrToLocalDate(data.resolveBy),
        tags: tagsPreview,
        unlisted: data.sharePublicly || questionDefaults?.unlisted || undefined,
        sharedPublicly:
          data.sharePublicly || questionDefaults?.sharePublicly || undefined,
        shareWithListIds: questionDefaults?.shareWithListIds,
        tournamentId: questionDefaults?.tournamentId,
      }

      if (isMultiChoice) {
        console.log(data.options)
        createQuestion.mutate(
          {
            ...createQuestionData,
            options: data.options!.map((option) => ({
              text: option.text,
              prediction: option.forecast / 100,
            })),
          },
          {
            onError(error, variables, context) {
              console.error("error creating multi-choice question: ", {
                error,
                variables,
                context,
              })
            },
            onSuccess(result) {
              if (onQuestionCreate && result) {
                onQuestionCreate(result)
              }
            },
          },
        )
      } else {
        createQuestion.mutate(
          {
            ...createQuestionData,
            prediction:
              data.predictionPercentage &&
              typeof data.predictionPercentage === "number" &&
              !isNaN(data.predictionPercentage)
                ? data.predictionPercentage / 100
                : undefined,
          },
          {
            onError(error, variables, context) {
              console.error("error creating binary question: ", {
                error,
                variables,
                context,
              })
            },
            onSuccess(result) {
              if (onQuestionCreate && result) {
                onQuestionCreate(result)
              }
            },
          },
        )
      }

      setTagsPreview([])
      reset()
      textAreaRef?.current?.focus()
    },
    [
      createQuestion,
      embedded,
      errors,
      onQuestionCreate,
      questionDefaults?.sharePublicly,
      questionDefaults?.shareWithListIds,
      questionDefaults?.tournamentId,
      questionDefaults?.unlisted,
      reset,
      tagsPreview,
      textAreaRef,
      userId,
    ],
  )

  useEffect(() => {
    if (resetTrigger) {
      reset()
      if (setResetTrigger) {
        setResetTrigger(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger])

  useEffect(() => {
    const cachedQuestionContent = localStorage.getItem(
      "cached_question_content",
    )
    if (cachedQuestionContent) {
      // User was not logged in when they tried to create a question, repopulate the form
      const cachedQuestion = SuperJSON.parse(cachedQuestionContent) as any
      cachedQuestion.question && setValue("question", cachedQuestion.question)
      cachedQuestion.predictionPercentage &&
        cachedQuestion.predictionPercentage !== "NaN" &&
        !isNaN(cachedQuestion.predictionPercentage) &&
        setValue("predictionPercentage", cachedQuestion.predictionPercentage)
      if (cachedQuestion.resolveBy) {
        try {
          // @ts-ignore - type definition is wrong (Date not string)
          setValue("resolveBy", getDateYYYYMMDD(cachedQuestion.resolveBy))
        } catch {
          // just skip it if we can't parse the date
        }
      }
      localStorage.removeItem("cached_question_content")
    }
  }, [setValue])

  useEffect(() => {
    const handlePredictAll = () => {
      void handleSubmit(onSubmit)()
    }
    window.addEventListener("predictAll", handlePredictAll)
    return () => {
      window.removeEventListener("predictAll", handlePredictAll)
    }
  }, [handleSubmit, onSubmit])

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  useEffect(() => {
    setFocus("question")
    if (
      questionDefaults?.title?.includes("<") &&
      questionDefaults?.title?.includes(">")
    ) {
      const start = questionDefaults.title.indexOf("<")
      const end = questionDefaults.title.indexOf(">") + 1
      textAreaRef?.current?.setSelectionRange(start, end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFocus])

  const [highlightResolveBy, setHighlightResolveBy] = useState(false)

  const [showSuggestions, setShowSuggestions] = useState(false)

  function smartUpdateResolveBy(newQuestionValue: string) {
    if (!dirtyFields.resolveBy && smartSetDates) {
      const dateResult = chrono.parse(newQuestionValue, new Date(), {
        forwardDate: true,
      })
      const newResolveBy =
        dateResult.length === 1 && dateResult[0].date()
          ? getDateYYYYMMDD(dateResult[0].date())
          : undefined

      if (
        newResolveBy &&
        newResolveBy !== getDateYYYYMMDD(utcDateStrToLocalDate(resolveByUTCStr))
      ) {
        setValue("resolveBy", newResolveBy)
        setHighlightResolveBy(true)
        setTimeout(() => setHighlightResolveBy(false), 800)
      }
    }
  }
  const {
    onChange: onChangeQuestion,
    ref: formRef,
    ...registerQuestion
  } = register("question", { required: true })
  const mergedTextAreaRef = mergeRefs([textAreaRef, formRef])

  function getTags(question: string) {
    const tags = question.match(/#\w+/g)
    return tags?.map((t) => t.replace("#", "")) || []
  }
  function updateTagsPreview(question: string) {
    const tags = getTags(question)
    if (tags.length > 0 || tagsPreview.length > 0) {
      setTagsPreview(tags)
    }
  }

  // TODO: maybe just question props?
  const binaryQuestionProps = {
    small,
    resolveByButtons,
    questionDefaults,
    embedded,
    userId,
    onSubmit,
    signInToFatebook,
    session,
    register,
    setValue,
    errors,
    watch,
    handleSubmit,
    textAreaRef,
    highlightResolveBy,
    clearErrors,
  }

  const multiChoiceQuestionProps = {
    small,
    resolveByButtons,
    questionDefaults,
    embedded,
    userId,
    onSubmit,
    signInToFatebook,
    session,
    register,
    setValue,
    errors,
    watch,
    handleSubmit,
    textAreaRef,
    highlightResolveBy,
    clearErrors,
  }

  return (
    <div className="w-full">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <form onSubmit={void handleSubmit(onSubmit)}>
          <div className="w-full relative">
            <TextareaAutosize
              className={clsx(
                "w-full border-2 border-neutral-300 rounded-md resize-none shadow-lg focus:shadow-xl transition-shadow mb-2",
                "focus:outline-indigo-700 placeholder:text-neutral-400",
                small ? "text-md py-2 pl-4 pr-16" : "text-xl py-4 pl-4 pr-16",
              )}
              placeholder={placeholder || "Will I finish my project by Friday?"}
              maxRows={15}
              onChange={(e) => {
                smartUpdateResolveBy(e.currentTarget.value)
                updateTagsPreview(e.currentTarget.value)
                void onChangeQuestion(e)
              }}
              onKeyDown={(e) => {
                if (onEnterSubmit(e)) return
                // current value doesn't include the key just pressed! So
                if (e.key.length === 1) {
                  smartUpdateResolveBy(e.currentTarget.value + e.key)
                }
              }}
              ref={mergedTextAreaRef}
              defaultValue={questionDefaults?.title}
              onMouseDown={(e) => e.stopPropagation()}
              {...registerQuestion}
            />

            {showQuestionSuggestionsButton && (
              <button
                tabIndex={-1}
                className={clsx(
                  "btn btn-circle aspect-square absolute right-3 top-2 hover:opacity-100",
                  showSuggestions ? "btn-active" : "btn-ghost",
                  !!question && !showSuggestions ? "opacity-20" : "opacity-80",
                  small && "btn-xs px-5 top-[0.2rem]",
                )}
                onClick={(e) => {
                  setShowSuggestions(!showSuggestions)
                  e.preventDefault()
                }}
              >
                <LightBulbIcon height={16} width={16} className="shrink-0" />
              </button>
            )}

            <Transition
              show={showSuggestions}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-98 translate-y-[-0.5rem]"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100 translate-y-0 "
              leaveTo="transform opacity-0 scale-98 translate-y-[-0.5rem]"
            >
              {(ref) => (
                <QuestionSuggestions
                  ref={ref as React.Ref<HTMLDivElement>}
                  chooseSuggestion={(suggestion) => {
                    setValue("question", suggestion, {
                      shouldTouch: true,
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    smartUpdateResolveBy(suggestion)
                  }}
                />
              )}
            </Transition>
          </div>
          {tagsPreview?.length > 0 && (
            <div className="italic text-neutral-400 text-sm p-1 mb-2">
              Tagging this question: {tagsPreview.join(", ")}
            </div>
          )}

          <QuestionTypeSelect
            questionType={questionType}
            setQuestionType={setQuestionType}
          />

          {(() => {
            switch (questionType) {
              case QuestionType.BINARY:
                return <BinaryQuestion {...binaryQuestionProps} />
              case QuestionType.MULTIPLE_CHOICE:
                return <MultiChoiceQuestion {...multiChoiceQuestionProps} />
              default:
                return <BinaryQuestion {...binaryQuestionProps} />
            }
          })()}
        </form>
      </ErrorBoundary>
    </div>
  )
}
