import { zodResolver } from '@hookform/resolvers/zod'
import * as chrono from 'chrono-node'
import clsx from "clsx"
import { signIn } from "next-auth/react"
import { KeyboardEvent, useEffect, useState } from "react"
import { ErrorBoundary } from 'react-error-boundary'
import { SubmitHandler, useForm } from "react-hook-form"
import TextareaAutosize from 'react-textarea-autosize'
import SuperJSON from 'trpc-transformer'
import { z } from "zod"
import { getDateYYYYMMDD, tomorrrowDate as tomorrowDate } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { useUserId } from '../lib/web/utils'
import { FormattedDate } from './FormattedDate'

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
  const resolveByDate = watch("resolveBy")
  const predictionPercentage = watch("predictionPercentage")

  const userId = useUserId()
  const utils = api.useContext()
  const createQuestion = api.question.create.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
    }
  })

  const onSubmit: SubmitHandler<z.infer<typeof predictFormSchema>> = (data, e) => {
    e?.preventDefault() // don't reload the page
    if (Object.values(errors).some(err => !!err)) return

    if (userId) {
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
    } else {
      localStorage.setItem("cached_question_content", SuperJSON.stringify(data))
      void signIn("google")
    }
  }

  useEffect(() => {
    const cachedQuestionContent = localStorage.getItem("cached_question_content")
    if (cachedQuestionContent) {
      // User was not logged in when they tried to create a question, repopulate the form
      const cachedQuestion = SuperJSON.parse(cachedQuestionContent) as any
      console.log({cachedQuestion})
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

  return (
    <div className="w-full">
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <form onSubmit={void handleSubmit(onSubmit)}>
          <TextareaAutosize
            className={clsx(
              "w-full text-xl border-2 border-gray-300 rounded-md p-4 resize-none shadow-lg mb-2 focus:outline-indigo-700",
            )}
            autoFocus={true}
            placeholder="Will humans walk on Mars by 2050?"
            maxRows={15}
            onKeyDown={(e) => {
              if (onEnterSubmit(e)) return
              if (!dirtyFields.resolveBy) {
                const dateResult = chrono.parse(e.currentTarget.value, new Date(), { forwardDate: true })
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
            }}
            {...register("question", { required: true })}
          />

          <div className="flex flex-row gap-8 flex-wrap justify-between">
            <div className='flex flex-row gap-2'>
              <div className='flex flex-col'>
                <label className="block" htmlFor="resolveBy">Resolve by</label>
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
                <label className="block" htmlFor="resolveBy">Make a prediction</label>
                <div className={clsx(
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="XX"
                    onKeyDown={onEnterSubmit}
                    {...register("predictionPercentage", { valueAsNumber: true })}
                  />
                  <span className={clsx(
                    'ml-px z-10 text-md font-bold',
                    !predictionPercentage && "text-gray-400",
                  )}>%</span>
                </div>
              </div>
            </div>
            <div className="self-center">
              <button onClick={(e) => {e.preventDefault(); void handleSubmit(onSubmit)()}}
                className="btn btn-primary btn-lg hover:scale-105"
                disabled={!!userId && (createQuestion.isLoading || Object.values(errors).some(err => !!err))}
              >
                {userId ? "Predict" : "Sign in to predict"}
              </button>
            </div>
          </div>
        </form>
      </ErrorBoundary>
    </div>
  )
}