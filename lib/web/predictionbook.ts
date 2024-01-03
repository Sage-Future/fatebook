import { Resolution } from "@prisma/client"
import { max } from "date-fns"
import prisma from "../_utils_server"
import { scoreQuestion } from "../interactive_handlers/resolve"
import { getPredictionBookIdPrefix } from "./utils"

interface PBUser {
  email: string
  name: string | null
  user_id: number
}

interface PBResponse {
  comment: string | null
  confidence: number | null
  created_at: string
  id: number
  updated_at: string
  user_id: number
  user_label: string
}

interface PBQuestion {
  created_at: string
  creator_id: number
  creator_label: string
  deadline: string
  description_with_group: string
  description: string
  group_id: number | null
  id: number
  mean_confidence: number
  outcome: boolean | null
  prediction_group_id: number | null
  updated_at: string
  last_judgement_at: string | null
  uuid: string
  version: number
  visibility: string
  withdrawn: boolean
  responses: PBResponse[]
}

interface MyPredictionsResponse {
  user: PBUser
  predictions: PBQuestion[]
}

export async function importFromPredictionBook(
  predictionBookApiToken: string,
  fatebookUserId: string,
) {
  console.log("Importing from PredictionBook")

  var page = 1
  var questions: PBQuestion[] = []
  var user: PBUser | null = null
  while (page < 1000) {
    const myPredictionsPage = await fetch(
      `https://predictionbook.com/api/my_predictions?${new URLSearchParams({
        api_token: predictionBookApiToken,
        page: page.toString(),
        page_size: "1000", // this is the max
      }).toString()}`,
    )
    const response: MyPredictionsResponse = await myPredictionsPage.json()
    if (!response.predictions || !response.predictions.length) {
      break
    }
    questions = questions.concat(response.predictions)
    if (response.user) {
      user = response.user
    }

    page++
  }
  console.log("Found ", questions.length, " questions for user ", user?.email)

  for (const question of questions) {
    const parts = {
      id: `${getPredictionBookIdPrefix()}_${fatebookUserId}_${question.id}`,
      title: question.description_with_group, // Prediction group is prepended to the prediction title, if it exists
      createdAt: new Date(question.created_at),
      resolved: question.outcome !== null,
      resolution:
        question.outcome === null
          ? null
          : question.outcome
            ? Resolution.YES
            : Resolution.NO,
      resolveBy: new Date(question.deadline),
      resolvedAt:
        question.outcome === null
          ? null
          : question.last_judgement_at
            ? new Date(question.last_judgement_at)
            : // PredictionBook previously didn't have a "resolved_at" field, so we used the deadline
              // or if there was an update after the deadline then just add 24 hours to the last update time
              max([
                new Date(
                  new Date(question.updated_at).getTime() + 24 * 60 * 60 * 1000,
                ),
                new Date(question.deadline),
              ]),
      sharedPublicly: question.visibility === "visible_to_everyone",
      notes: `[This question was imported from PredictionBook](https://predictionbook.com/predictions/${question.id})`,
    }
    const upsertedQuestion = await prisma.question.upsert({
      where: {
        id: parts.id,
      },
      update: parts,
      create: {
        ...parts,
        user: {
          connect: {
            id: fatebookUserId,
          },
        },
        forecasts: {
          createMany: {
            data: question.responses
              .filter(
                (r) => r.confidence !== null && r.user_id === user?.user_id,
              )
              .map((response) => ({
                forecast: response.confidence! / 100,
                createdAt: new Date(response.created_at),
                userId: fatebookUserId, // todo check if other people' predictions on my questions show up here
              })),
          },
        },
        comments: {
          createMany: {
            data: question.responses
              .filter((r) => r.comment !== null && r.user_id === user?.user_id)
              .map((response) => ({
                comment: response.comment!,
                createdAt: new Date(response.created_at),
                userId: fatebookUserId, // todo check if other people' predictions on my questions show up here
              })),
          },
        },
      },
      include: {
        forecasts: true,
        questionScores: true,
      },
    })

    if (upsertedQuestion.resolution && upsertedQuestion.resolvedAt) {
      console.log("Scoring question ", upsertedQuestion.id)
      await scoreQuestion(upsertedQuestion.resolution, upsertedQuestion)
      // update all the question scores to have the same created at as the question
      await prisma.questionScore.updateMany({
        where: {
          questionId: upsertedQuestion.id,
        },
        data: {
          createdAt: upsertedQuestion.resolvedAt,
        },
      })
      console.log("Scored question ", upsertedQuestion.id)
    }
  }
}
