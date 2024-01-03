import { Decimal } from "@prisma/client/runtime/library"
import {
  BlockActionPayload,
  BlockActionPayloadAction,
} from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import { floatEquality } from "../_utils_common"
import prisma, {
  backendAnalyticsEvent,
  getOrCreateProfile,
  postMessageToResponseUrl,
  updateForecastQuestionMessages,
  updateMessage,
} from "../_utils_server"
import { SubmitTextForecastActionParts } from "../blocks-designs/_block_utils"
import { buildQuestionBlocks } from "../blocks-designs/question"
import { buildStaleForecastsReminderBlock } from "../blocks-designs/stale_forecasts"

export async function getLastForecast(userId: string, questionId: string) {
  const forecasts = await prisma.forecast.findMany({
    where: {
      userId: userId,
      questionId: questionId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  })
  return forecasts[0]
}

export async function submitTextForecast(
  actionParts: SubmitTextForecastActionParts,
  action: BlockActionPayloadAction,
  payload: BlockActionPayload,
) {
  if (actionParts.questionId === undefined)
    throw Error("blockActions: missing qID on action_id")

  if (!payload.team?.id || !payload.user?.id) {
    throw Error(`Missing team or user in payload ${JSON.stringify(payload)}`)
  }

  if (!payload.response_url) {
    throw Error(`No response_url in payload ${JSON.stringify(payload)}`)
  }

  const textInput = action.value
  const number = textInput && Number(textInput.trim().replace("%", ""))
  if (
    textInput === undefined ||
    textInput === "" ||
    !number ||
    Number.isNaN(number) ||
    (number && (number < 0 || number > 100))
  ) {
    await postMessageToResponseUrl(
      {
        text: `To make a prediction, enter a number between 0% and 100%, e.g. "50%"`,
        response_type: "ephemeral",
        replace_original: false,
      },
      payload.response_url,
    )

    return
  }

  const { questionId } = actionParts

  let profile
  try {
    profile = await getOrCreateProfile(payload.team.id, payload.user.id)
  } catch (e) {
    console.error(e)
    await postMessageToResponseUrl(
      {
        text: `Sorry, I couldn't find your profile. Please try again.`,
        response_type: "ephemeral",
        replace_original: false,
      },
      payload.response_url,
    )
    return
  }

  // dealing with duplicate forecasts
  //   check if the last forecast was:
  //    within 1 minutes
  //    & has the same value
  const lastForecast = await getLastForecast(profile.user.id, questionId)
  if (
    lastForecast &&
    floatEquality(lastForecast.forecast.toNumber(), number / 100)
  ) {
    const lastForecastTime = new Date(lastForecast.createdAt).getTime()
    const now = new Date().getTime()
    const timeDiff = now - lastForecastTime
    if (timeDiff < 1 * 60 * 1000) {
      console.log(
        `Duplicate forecast detected for ${profile.id} on ${questionId}\nExiting`,
      )
      return
    }
  }

  const forecastCreated = await prisma.forecast.create({
    data: {
      user: {
        connect: {
          id: profile.user.id,
        },
      },
      question: {
        connect: {
          id: questionId,
        },
      },
      profile: {
        connect: {
          id: profile.id,
        },
      },
      forecast: new Decimal(number / 100), // convert 0-100% to 0-1
    },
  })

  console.log("Forecast created: ", forecastCreated)

  if (
    actionParts.reminderBlockForecastIds &&
    actionParts.reminderBlockForecastIds.length > 0
  ) {
    const filteredForecasts = await getReminderMessageForecasts(
      questionId,
      actionParts.reminderBlockForecastIds,
    )
    await postMessageToResponseUrl(
      {
        text: `Thanks for submitting your forecast!`,
        blocks: await buildStaleForecastsReminderBlock(
          filteredForecasts,
          payload.team.id,
        ),
        replace_original: true,
      },
      payload.response_url,
    )

    const questionToUpdate = filteredForecasts.filter(
      (forecast) => forecast.questionId === questionId,
    )[0].question
    await updateForecastQuestionMessages(questionToUpdate, "")
  } else if (payload.message?.ts && payload.channel?.id) {
    await updateQuestionMessages(
      payload.team.id,
      payload.message.ts,
      payload.channel.id,
      payload.user.id,
    )
  } else {
    console.error(
      `Missing message.ts or channel.id in payload ${JSON.stringify(payload)}`,
    )
  }

  await backendAnalyticsEvent("forecast_submitted", {
    platform: "slack",
    team: payload.team.id,
    user: payload.user.id,
    question: questionId,
    forecast: number,
  })
}

async function getReminderMessageForecasts(
  questionId: string,
  forecastIds: number[],
) {
  const forecasts = await prisma.forecast.findMany({
    where: {
      OR: [
        {
          id: {
            in: forecastIds,
          },
        },
        {
          questionId: questionId,
        },
      ],
    },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
      question: {
        include: {
          user: {
            include: {
              profiles: true,
            },
          },
          questionMessages: {
            include: {
              message: true,
            },
          },
          resolutionMessages: {
            include: {
              message: true,
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
      },
    },
  })

  //filter out all the forecasts except the most recent for forecasts that have questionId
  const mostRecentQuestionIdForecast = forecasts
    .filter((forecast) => forecast.questionId === questionId)
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })[0]
  const filteredForecasts = forecasts
    .filter((forecast) => forecast.questionId !== questionId)
    .concat(mostRecentQuestionIdForecast)

  return filteredForecasts
}

async function updateQuestionMessages(
  teamId: string,
  questionTs: string,
  channel: string,
  slackUserId: string,
) {
  const questions = await prisma.question.findMany({
    where: {
      questionMessages: {
        some: {
          AND: {
            message: {
              ts: questionTs,
              channel: channel,
            },
          },
        },
      },
    },
    include: {
      forecasts: {
        include: {
          user: {
            include: {
              profiles: true,
            },
          },
        },
      },
      user: {
        include: {
          profiles: true,
        },
      },
    },
  })

  if (!questions) {
    console.error(
      `No question with ts ${questionTs} found. Maybe it's been deleted?`,
    )
    return
  }

  console.log(`Updating ${questions.length} question messages `, questions)
  for (const question of questions) {
    const questionBlocks = await buildQuestionBlocks(teamId, question)
    await updateMessage(
      teamId,
      {
        ts: questionTs,
        channel: channel,
        blocks: questionBlocks,
        text: `New forecasts on '${question.title}'`,
      },
      true,
      slackUserId,
    )
  }
}
