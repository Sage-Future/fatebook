import * as chrono from 'chrono-node'
import clsx from "clsx"
import { signIn } from "next-auth/react"
import { KeyboardEvent, useEffect } from "react"
import { ErrorBoundary } from 'react-error-boundary'
import { SubmitHandler, useForm } from "react-hook-form"
import TextareaAutosize from 'react-textarea-autosize'
import SuperJSON from 'trpc-transformer'
import { z } from "zod"
import { getDateYYYYMMDD, tomorrrowDate as tomorrowDate } from '../lib/_utils_common'
import { api } from "../lib/web/trpc"
import { useUserId } from '../lib/web/utils'
import { zodResolver } from '@hookform/resolvers/zod'

export function Predict() {
  const predictFormSchema = z.object({
    question: z.string().min(1),
    resolveBy: z.date(),
    predictionPercentage: z.number().min(0).max(100).or(z.nan()),
  })

  const { register, handleSubmit, setFocus, reset, formState: { dirtyFields, errors }, setValue } = useForm<z.infer<typeof predictFormSchema>>({
    mode: "all",
    resolver: zodResolver(predictFormSchema),
  })
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
      cachedQuestion.predictionPercentage && setValue("predictionPercentage", cachedQuestion.predictionPercentage)
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
                const resolveBy = (dateResult.length === 1 && dateResult[0].date()) ?
                  getDateYYYYMMDD(dateResult[0].date())
                  :
                  undefined

                // @ts-ignore - type definition is wrong (Date not string)
                resolveBy && setValue("resolveBy", resolveBy)
              }
            }}
            {...register("question", { required: true })}
          />

          <div className="flex flex-row gap-2">
            <div>
              <label className="block" htmlFor="resolveBy">Resolve by</label>
              <input
                className={clsx(
                  "text-md border-2 border-gray-300 rounded-md p-2 resize-none focus:outline-indigo-700",
                  errors.resolveBy && "border-red-500"
                )}
                type="date"
                defaultValue={
                  getDateYYYYMMDD(new Date(tomorrowDate()))
                }
                onKeyDown={onEnterSubmit}
                {...register("resolveBy", { required: true, valueAsDate: true })}
              />
            </div>

            <div>
              <label className="block" htmlFor="resolveBy">Make a prediction</label>
              <div className={clsx(
                'text-md bg-white border-2 border-gray-300 rounded-md p-2 flex focus-within:border-indigo-700',
                errors.predictionPercentage && "border-red-500"
              )}>
                <input
                  className={clsx(
                    "resize-none text-right w-7 flex-grow outline-none"
                  )}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="XX"
                  onKeyDown={onEnterSubmit}
                  {...register("predictionPercentage", { valueAsNumber: true })}
                />
                <span className='ml-px'>%</span>
                <span>{errors.predictionPercentage?.message}</span>
              </div>
            </div>
          </div>

          <div className="py-4">
            <button onClick={(e) => {e.preventDefault(); void handleSubmit(onSubmit)()}} className="button block primary"
              disabled={!!userId && (createQuestion.isLoading || Object.values(errors).some(err => !!err))}
            >
              {userId ? "Predict" : "Sign in to predict"}
            </button>
          </div>
        </form>
      </ErrorBoundary>
    </div>
  )
}