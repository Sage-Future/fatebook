import { Transition } from '@headlessui/react'
import { LightBulbIcon } from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import * as chrono from 'chrono-node'
import clsx from "clsx"
import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { SubmitHandler, useForm } from "react-hook-form"
import TextareaAutosize from 'react-textarea-autosize'
import SuperJSON from 'trpc-transformer'
import { z } from "zod"
import { getDateYYYYMMDD, tomorrrowDate as tomorrowDate } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { signInToFatebook, useUserId } from '../lib/web/utils'
import { FormattedDate } from './FormattedDate'
import { InfoButton } from './InfoButton'

export function Predict() {
  const predictFormSchema = z.object({
    question: z.string().min(1),
    resolveBy: z.date(),
    predictionPercentage: z.number().min(0).max(100).or(z.nan()),
  })

  const { register, handleSubmit, setFocus, reset, formState: { dirtyFields, errors }, watch, setValue } = useForm<z.infer<typeof predictFormSchema>>({
    mode: "all",
    resolver: zodResolver(predictFormSchema),
  })
  const question = watch("question")
  const resolveByDate = watch("resolveBy")
  const predictionPercentage = watch("predictionPercentage")

  const userId = useUserId()
  const utils = api.useContext()
  const createQuestion = api.question.create.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate({}, {
        refetchPage: (lastPage, index) => index === 0, // assumes the new question is on the first page (must be ordered by recent)
      })
      await utils.question.getForecastCountByDate.invalidate()
    }
  })

  const onSubmit: SubmitHandler<z.infer<typeof predictFormSchema>> = (data, e) => {
    e?.preventDefault() // don't reload the page

    if (!userId) {
      localStorage.setItem("cached_question_content", SuperJSON.stringify(data))
      void signInToFatebook()
      return
    }

    if (Object.values(errors).some(err => !!err)) return

    createQuestion.mutate({
      title: data.question,
      resolveBy: data.resolveBy,
      prediction: (data.predictionPercentage && typeof data.predictionPercentage === "number" && !isNaN(data.predictionPercentage))
        ?
        data.predictionPercentage / 100
        :
        undefined,
    }, {
      onError(error, variables, context) {
        console.error("error creating question: ", {error, variables, context})
      },
    })

    reset()
  }

  useEffect(() => {
    const cachedQuestionContent = localStorage.getItem("cached_question_content")
    if (cachedQuestionContent) {
      // User was not logged in when they tried to create a question, repopulate the form
      const cachedQuestion = SuperJSON.parse(cachedQuestionContent) as any
      cachedQuestion.question && setValue("question", cachedQuestion.question)
      cachedQuestion.predictionPercentage && cachedQuestion.predictionPercentage !== "NaN" && !isNaN(cachedQuestion.predictionPercentage) && setValue("predictionPercentage", cachedQuestion.predictionPercentage)
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

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  useEffect(() => {
    setFocus("question")
  }, [setFocus])

  const [highlightResolveBy, setHighlightResolveBy] = useState(false)

  const { ref: predictionInputRef, ...predictionPercentageRegister} = register("predictionPercentage", { valueAsNumber: true })
  const predictionInputRefMine = useRef<HTMLInputElement | null>(null)

  const [showSuggestions, setShowSuggestions] = useState(false)

  function smartUpdateResolveBy(newQuestionValue: string) {
    if (!dirtyFields.resolveBy) {
      const dateResult = chrono.parse(newQuestionValue, new Date(), { forwardDate: true })
      const newResolveBy = (dateResult.length === 1 && dateResult[0].date()) ?
        getDateYYYYMMDD(dateResult[0].date())
        :
        undefined

      if (newResolveBy && new Date(newResolveBy).getTime() !== resolveByDate.getTime()) {
      // @ts-ignore - type definition is wrong (Date not string)
        setValue("resolveBy", newResolveBy)
        setHighlightResolveBy(true)
        setTimeout(() => setHighlightResolveBy(false), 800)
      }
    }
  }
  const {onChange: onChangeQuestion, ...registerQuestion} = register("question", { required: true })

  return (
    <div className="w-full">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <form onSubmit={void handleSubmit(onSubmit)}>
          <div className="w-full relative">
            <TextareaAutosize
              className={clsx(
                "w-full text-xl border-2 border-gray-300 rounded-md py-4 pl-4 pr-16 resize-none shadow-lg mb-2",
                "focus:outline-indigo-700",
              )}
              autoFocus={true}
              placeholder="Will humans walk on Mars by 2050?"
              maxRows={15}
              onChange={(e) => {
                smartUpdateResolveBy(e.currentTarget.value)
                void onChangeQuestion(e)
              }}
              onKeyDown={(e) => {
                if (onEnterSubmit(e)) return
                // smartUpdateResolveBy(e.currentTarget.value)
                // current value doesn't include the key just pressed! So
                if (e.key.length === 1) {
                  smartUpdateResolveBy(e.currentTarget.value + e.key)
                }
              }}
              {...registerQuestion}
            />
            <button
              className={clsx(
                'btn btn-circle aspect-square absolute right-3 top-2 hover:opacity-100',
                showSuggestions ? 'btn-active' : 'btn-ghost',
                (!!question && !showSuggestions) ? 'opacity-20':  'opacity-80',
              )}
              onClick={(e) => {
                setShowSuggestions(!showSuggestions)
                e.preventDefault()
              }}
            >
              <LightBulbIcon height={16} width={16} />
            </button>

            <Transition
              show={showSuggestions}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-98 translate-y-[-0.5rem]"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100 translate-y-0 "
              leaveTo="transform opacity-0 scale-98 translate-y-[-0.5rem]"
            >
              <QuestionSuggestions
                chooseSuggestion={(suggestion) => {
                  setValue("question", suggestion, { shouldTouch: true, shouldDirty: true, shouldValidate: true })
                  smartUpdateResolveBy(suggestion)
                }} />
            </Transition>
          </div>

          <div className="flex flex-row gap-8 flex-wrap justify-between">
            <div className='flex flex-row gap-2'>
              <div className='flex flex-col'>
                <label className="flex" htmlFor="resolveBy">Resolve by
                  <InfoButton className='ml-1 tooltip-right' tooltip='When should I remind you to resolve this question?' />
                </label>  
                <input
                  className={clsx(
                    "text-md border-2 border-gray-300 rounded-md p-2 resize-none focus:outline-indigo-700 transition-shadow duration-1000",
                    errors.resolveBy && "border-red-500",
                    highlightResolveBy && "shadow-[0_0_50px_-1px_rgba(0,0,0,1)] shadow-indigo-700 duration-100"
                  )}
                  type="date"
                  defaultValue={
                    getDateYYYYMMDD(new Date(tomorrowDate()))
                  }
                  onKeyDown={onEnterSubmit}
                  {...register("resolveBy", { required: true, valueAsDate: true })}
                />
                <span className='italic text-gray-400 text-sm p-1'>
                  <FormattedDate date={resolveByDate} alwaysUseDistance={true} capitalise={true} currentDateShowToday={true} hoverTooltip={false} />
                </span>
              </div>

              <div className='min-w-fit'>
                <label className="flex" htmlFor="resolveBy">Make a prediction
                  <InfoButton className='ml-1 tooltip-left' tooltip='How likely do you think the answer is to be YES?' />
                </label>
                <div
                  className={clsx(
                    'text-md bg-white border-2 border-gray-300 rounded-md p-2 flex focus-within:border-indigo-700 relative',
                    errors.predictionPercentage && "border-red-500",
                  )}>
                  <div
                    className={clsx(
                      'h-full bg-indigo-700 absolute -m-2 rounded-l pointer-events-none opacity-20 bg-gradient-to-br from-indigo-400 to-indigo-600 transition-all',
                      predictionPercentage >= 100 && "rounded-r",
                    )}
                    style={{
                      width: `${Math.min(Math.max(predictionPercentage || 0, 0), 100)}%`,
                    }}
                  />
                  <input
                    className={clsx(
                      "resize-none text-right w-7 flex-grow outline-none bg-transparent z-10 text-xl font-bold placeholder:font-normal"
                    )}
                    autoComplete="off"
                    type='number'
                    inputMode="decimal"
                    pattern="[0-9[.]*"
                    placeholder="XX"
                    onKeyDown={onEnterSubmit}
                    {...predictionPercentageRegister}
                    ref={(e) => {
                      predictionInputRef(e)
                      predictionInputRefMine.current = e
                    }}
                  />
                  <span
                    onClick={() => {
                      (predictionInputRefMine.current as any)?.focus()
                    }}
                    className={clsx(
                      'ml-px z-10 text-md font-bold select-none cursor-text',
                      !predictionPercentage && "text-gray-400",
                    )}>%</span>
                </div>
              </div>
            </div>
            <div className="self-center">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  void handleSubmit(onSubmit)()
                }}
                className="btn btn-primary btn-lg hover:scale-105"
                disabled={!!userId && (Object.values(errors).some(err => !!err))}
              >
                {userId ? "Predict" : "Sign up to predict"}
              </button>
            </div>
          </div>
        </form>
      </ErrorBoundary>
    </div>
  )
}

function QuestionSuggestions({
  chooseSuggestion
}: {
  chooseSuggestion: (suggestion: string) => void
}) {
  const suggestions = [
    "Will GPT-5 be released before Jan 2025?",
    "Will I write a blog post this week?",
    "Will volunteering abroad make me all-things-considered happier?",
    "Each day I’ll write down whether I want to leave or stay in my job. After 2 months, will I have chosen ‘leave’ on >30 days?",
    "Will I judge that AI was a major topic of debate in the US election?",
    "Will I finish my todo list today?",
    "Will our user satisfaction rating exceed 8.0/10?",
    "Will I win my next game of Agricola?",
    "Will Our World in Data report that >5% of global deaths are due to air pollution by 2030?",
    "Will I still be discussing my fear of flying with my therapist in 2024?",
    "If we choose this HR provider, will I think it was a good idea in two month’s time?",
    "Will AMF be funding-constrained this year?",
    "Will I have a child by Jan 2025?",
    "Will my mentor agree that pivoting now was the right choice?",
    "Will I meditate every day this week?",
    "Will the rest of the team prefer this redesign to the current layout?",
    "Will anyone on the animal advocacy forum share evidence that convinces me that abolitionist protests are net-beneficial?",
    "Will >80% of my Twitter followers agree that I should keep the beard?",
    "On December 1st, will Marco, Dawn, and Tina all agree that the biosecurity bill passed without amendments that removed its teeth?",
    "If I survey 40 random Americans online, will our current favourite name be the most popular?"
  ]

  const [showAll, setShowAll] = useState(false)

  return (
    <div className='w-full bg-white shadow-inner rounded-b-md px-6 pt-4 pb-6 mb-6 flex flex-col items-start gap-2 z-10'>
      <h4 className='select-none pl-4'>{"Here's a few ideas..."}</h4>
      {suggestions.slice(0, showAll ? undefined : 8).map((suggestion) => (
        <button
          key={suggestion}
          className='btn btn-ghost text-left text-gray-500 font-normal leading-normal'
          onClick={(e) => {
            chooseSuggestion(suggestion)
            e.preventDefault()
          }}
        >
          <span className='ml-4'>
            <span className='text-gray-500 font-semibold mr-2 -ml-4'>+</span>
            <span>{suggestion}</span>
          </span>
        </button>
      ))}
      {!showAll && <button
        className='btn'
        onClick={(e) => {
          e.preventDefault()
          setShowAll(true)
        }}>
        Show more
      </button>}
    </div>
  )
}