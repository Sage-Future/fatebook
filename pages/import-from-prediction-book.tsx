import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { NextSeo } from "next-seo"
import Link from "next/link"
import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { Questions } from "../components/Questions"
import { api } from "../lib/web/trpc"
import {
  getPredictionBookIdPrefix,
  signInToFatebook,
  useUserId,
} from "../lib/web/utils"

export default function ImportPage() {
  const userId = useUserId()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Import from PredictionBook" />
      <div className="prose mx-auto">
        <h4>Import all your PredictionBook predictions to Fatebook</h4>
        {userId ? (
          <PredictionBookImport />
        ) : (
          <button
            className="button primary mx-auto"
            onClick={() => void signInToFatebook()}
          >
            Sign in or sign up to import your predictions from PredictionBook
          </button>
        )}
      </div>
    </div>
  )
}

const predictionBookImportSchema = z.object({
  predictionBookApiToken: z.string().min(1),
})

function PredictionBookImport() {
  const userId = useUserId()
  const utils = api.useContext()
  const importFromPredictionBook =
    api.import.importFromPredictionBook.useMutation({
      async onSuccess() {
        await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      },
    })
  const deleteAllPredictionBookQuestions =
    api.import.deleteAllPredictionBookQuestions.useMutation({
      async onSuccess() {
        await utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate()
      },
    })

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<z.infer<typeof predictionBookImportSchema>>({
    resolver: zodResolver(predictionBookImportSchema),
  })

  const onSubmit: SubmitHandler<z.infer<typeof predictionBookImportSchema>> = (
    data,
    e,
  ) => {
    e?.preventDefault() // don't reload the page
    if (Object.values(errors).some((err) => !!err)) return

    if (!userId) return

    importFromPredictionBook.mutate({
      predictionBookApiToken: data.predictionBookApiToken,
    })
  }

  return (
    <>
      <NextSeo
        title="Import from PredictionBook"
        description="Import all of your historical predictions from PredictionBook into Fatebook"
      />
      <form onSubmit={void handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <label htmlFor="predictionBookApiToken">
            Go to{" "}
            <Link href="https://predictionbook.com/" target="_blank">
              PredictionBook
            </Link>
            {", click 'Settings', generate an API token, then paste it here"}
          </label>
          <input
            type="text"
            placeholder="Your PredictionBook API Token"
            className={clsx(
              "text-md bg-white border-2 border-neutral-300 rounded-md p-2 flex focus-within:outline-indigo-700",
              errors.predictionBookApiToken &&
                "border-red-500 focus-within:outline-red-500",
            )}
            {...register("predictionBookApiToken")}
            disabled={!userId || importFromPredictionBook.isLoading}
          />
          <button
            className="btn btn-primary"
            type="submit"
            onClick={(e) => {
              e.preventDefault()
              void handleSubmit(onSubmit)()
            }}
            disabled={
              !userId ||
              importFromPredictionBook.isLoading ||
              Object.values(errors).some((err) => !!err)
            }
          >
            Import from PredictionBook
          </button>

          <button
            className="btn"
            onClick={(e) => {
              e.preventDefault()
              confirm("Are you sure? This can't be undone") &&
                deleteAllPredictionBookQuestions.mutate()
            }}
            disabled={!userId || deleteAllPredictionBookQuestions.isLoading}
          >
            Delete all your questions imported from PredictionBook
          </button>
        </div>
      </form>
      <div className="mt-20">
        <Questions
          title="Your questions imported from PredictionBook"
          noQuestionsText="No questions imported from PredictionBook yet"
          filterClientSide={(question) =>
            question.id.startsWith(getPredictionBookIdPrefix()) &&
            question.userId === userId
          }
        />
      </div>
    </>
  )
}
