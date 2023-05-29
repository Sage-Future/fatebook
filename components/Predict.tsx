import * as chrono from 'chrono-node'
import clsx from "clsx"
import { useSession } from "next-auth/react"
import { KeyboardEvent, useEffect } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import TextareaAutosize from 'react-textarea-autosize'
import { z } from "zod"
import { api } from "../lib/web/trpc"
import { getDateYYYYMMDD, tomorrrowDate as tomorrowDate } from '../lib/web/utils'

const predictFormSchema = z.object({
  question: z.string().min(1),
  resolveBy: z.date(),
  predictionPercentage: z.number().max(100).min(0),
})
export function Predict() {
  const { register, handleSubmit, setFocus, reset, formState: { dirtyFields, errors }, setValue } = useForm<z.infer<typeof predictFormSchema>>({mode: "all"})
  const session = useSession()
  const utils = api.useContext()
  const createQuestion = api.question.create.useMutation({
    async onSuccess() {
      await utils.question.getQuestionsUserCreatedOrForecastedOn.invalidate({userId: session.data?.user.id})
    }
  })

  const onSubmit: SubmitHandler<z.infer<typeof predictFormSchema>> = (data, e) => {
    e?.preventDefault() // don't reload the page
    console.log({data})
    if (session.data?.user.id) {
      createQuestion.mutate({
        title: data.question,
        resolveBy: data.resolveBy,
        authorId: session.data?.user.id,
        prediction: data.predictionPercentage ? data.predictionPercentage / 100 : undefined,
      })

      reset()
    } else {
      window.alert("You must be signed in to make a prediction.")
    }
  }

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
      <form onSubmit={void handleSubmit(onSubmit)}>
        <TextareaAutosize
          className={clsx(
            "w-full text-xl border-2 border-gray-300 rounded-md p-4 resize-none",
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
                "text-md border-2 border-gray-300 rounded-md p-2 resize-none",
                errors.resolveBy && "border-red-500"
              )}
              type="date"
              defaultValue={
                new Date(tomorrowDate()).toISOString().split("T")[0]
              }
              onKeyDown={onEnterSubmit}
              {...register("resolveBy", { required: true, valueAsDate: true })}
            />
          </div>

          <div>
            <label className="block" htmlFor="resolveBy">Make a prediction</label>
            <input
              className={clsx(
                "text-md border-2 border-gray-300 rounded-md p-2 resize-none",
                errors.predictionPercentage && "border-red-500"
              )}
              placeholder="XX%"
              onKeyDown={onEnterSubmit}
              {...register("predictionPercentage")}
            />
          </div>
        </div>

        <div className="py-4">
          <button onClick={(e) => {e.preventDefault(); void handleSubmit(onSubmit)()}} className="block primary"
            disabled={createQuestion.isLoading || Object.values(errors).some(err => !!err)}
          >
            Predict
          </button>
        </div>
      </form>
    </div>
  )
}