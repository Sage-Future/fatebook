import { Profile, User } from "@prisma/client"
import { backendAnalyticsEvent, postSlackMessage } from "../_utils_server"
import { buildQuestionBlocks } from "../blocks-designs/question"
import prisma from "../prisma"

export async function createForecastingQuestion(
  teamId: string,
  {
    question,
    date,
    forecastNum,
    profile,
    user,
    channelId,
    notes,
    hideForecastsUntilPrediction,
    hideForecastsUntil,
    slackUserId,
  }: {
    question: string
    date: Date
    forecastNum?: number
    profile: Profile
    user: User
    channelId: string
    notes?: string
    hideForecastsUntilPrediction?: boolean
    hideForecastsUntil?: Date | null
    slackUserId?: string
  },
) {
  console.log("creating")
  const createdQuestion = await prisma.question.create({
    data: {
      title: question,
      resolveBy: date,
      userId: user.id,
      profileId: profile.id,
      notes,
      hideForecastsUntil,
      hideForecastsUntilPrediction,
      forecasts: forecastNum
        ? {
            create: {
              profileId: profile.id,
              userId: user.id,
              forecast: forecastNum,
            },
          }
        : {},
    },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
      forecasts: {
        include: {
          user: {
            include: {
              profiles: true,
            },
          },
        },
      },
    },
  })

  console.log("created")

  const questionBlocks = await buildQuestionBlocks(teamId, createdQuestion)

  let questionPostedSuccessfully = true
  let data
  try {
    data = await postSlackMessage(
      teamId,
      {
        channel: channelId,
        text: `Forecasting question created: ${question}`,
        blocks: questionBlocks,
        unfurl_links: false,
        unfurl_media: false,
      },
      slackUserId,
    )

    if ((data as any)?.notifiedUserAboutEmptyChannel) {
      questionPostedSuccessfully = false

      await backendAnalyticsEvent("question_create_failed_invalid_channel", {
        platform: "slack",
        team: teamId,
        user: profile.userId,
      })
    }
  } catch (err) {
    questionPostedSuccessfully = false
  }

  // if question slack message failed to post, delete the question
  if (!questionPostedSuccessfully) {
    await prisma.question.delete({
      where: {
        id: createdQuestion.id,
      },
    })
    console.log(
      "Immediately deleted question because slack message failed to post",
    )
    return
  }

  if (!data?.ts) {
    console.error(`Missing message.ts in response ${JSON.stringify(data)}`)
    throw new Error("Missing message.ts in response")
  }

  console.log(`updating`)
  await prisma.question.update({
    where: {
      id: createdQuestion.id,
    },
    data: {
      questionMessages: {
        create: {
          message: {
            create: {
              ts: data.ts,
              channel: channelId,
              teamId: teamId,
            },
          },
        },
      },
    },
  })
  console.log("Recorded question message ts ", data?.ts)

  await backendAnalyticsEvent("question_created", {
    platform: "slack",
    team: teamId,
    user: profile.userId,
  })
}
