import {
  Forecast,
  Question,
  QuestionScore,
  QuestionType,
  Resolution,
  SlackMessage,
} from "@prisma/client"
import { BlockActionPayload } from "seratch-slack-types/app-backend/interactive-components/BlockActionPayload"
import {
  QuestionWithAuthorAndQuestionMessages,
  QuestionWithForecastsAndOptionsAndScores,
  QuestionWithForecastsAndScores,
  QuestionWithQuestionMessagesAndForecastWithUserWithProfiles,
  QuestionWithScores,
} from "../../prisma/additional"
import { relativeBrierScoring, ScoreCollection, ScoreTuple } from "../_scoring"
import {
  ResolveQuestionActionParts,
  UndoResolveActionParts,
} from "../blocks-designs/_block_utils"
import { buildQuestionResolvedBlocks } from "../blocks-designs/question_resolved"

import {
  averageScores,
  filterToUniqueIds,
  getResolutionEmoji,
  round,
} from "../_utils_common"
import {
  backendAnalyticsEvent,
  getDateSlackFormat,
  getTarget,
  getUserNameOrProfileLink,
  postBlockMessage,
  postEphemeralSlackMessage,
  postMessageToResponseUrl,
  updateForecastQuestionMessages,
  updateResolutionQuestionMessages,
  updateResolvePingQuestionMessages,
} from "../_utils_server"
import { buildQuestionResolvedBroadcastBlocks } from "../blocks-designs/question_resolved_broadcast"
import prisma from "../prisma"
import { createNotification } from "../web/notifications"
import { getQuestionUrl } from "../web/question_url"
import { getMarkdownLinkQuestionTitle } from "../web/utils"
import { Decimal } from "@prisma/client/runtime/library"

async function dbResolveQuestion(questionid: string, resolution: Resolution) {
  console.log(`      dbResolveQuestion ${questionid} - ${resolution}`)
  return await prisma.question.update({
    where: {
      id: questionid,
    },
    data: {
      resolved: true,
      resolution: resolution,
      resolvedAt: new Date(),
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
      options: {
        include: {
          forecasts: true,
        },
      },
      comments: {
        include: {
          user: true,
        },
      },
      sharedWith: true,
      sharedWithLists: {
        include: {
          users: true,
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
      pingResolveMessages: {
        include: {
          message: true,
        },
      },
      questionScores: true,
    },
  })
}

async function dbResolveQuestionOption(questionId: string, resolution: string) {
  console.log(`dbResolveQuestionOption ${questionId} - ${resolution}`)

  // Fetch the question with its options
  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      options: true,
    },
  })

  if (!question) {
    throw new Error(`Question with id ${questionId} not found`)
  }

  // Prepare the updates for the options
  const updatedOptions = question.options.map((option) => {
    console.log(`text ${option.text} | resolution: ${resolution}`)
    console.log(option.text === resolution)
    return {
      where: { id: option.id },
      data: {
        resolution: option.text === resolution ? Resolution.YES : Resolution.NO,
        resolvedAt: new Date(),
      },
    }
  })

  // Apply the updates to the options
  for (const update of updatedOptions) {
    await prisma.questionOption.update(update)
  }

  let resolutionValue: Resolution
  if (Object.values(Resolution).includes(resolution as Resolution)) {
    resolutionValue = resolution as Resolution
  } else {
    resolutionValue = resolution === "OTHER" ? Resolution.NO : Resolution.YES
  }

  // Update the question's resolution and other fields
  return prisma.question.update({
    where: {
      id: questionId,
    },
    data: {
      resolved: true,
      resolution: resolutionValue,
      resolvedAt: new Date(),
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
      options: {
        include: {
          forecasts: true,
        },
      },
      comments: {
        include: {
          user: true,
        },
      },
      sharedWith: true,
      sharedWithLists: {
        include: {
          users: true,
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
      pingResolveMessages: {
        include: {
          message: true,
        },
      },
      questionScores: true,
    },
  })
}

export async function scoreForecasts(
  scoreArray: ScoreCollection,
  question: QuestionWithScores,
) {
  console.log(`updating questionScores for question id: ${question.id}`)

  // in case the question was previously resolved, delete all questionScores
  // this should only happen if the user pressed resolve yes and no in rapid succession
  // there's potential for nasty race conditions if this goes wrong...
  if (question.questionScores) {
    console.warn(
      "Warning: questionScores already existed for question being resolved. Deleting all previous questionScores.",
      { dscores: question.questionScores },
    )
    await prisma.questionScore.deleteMany({
      where: {
        questionId: question.id,
      },
    })
  }

  let updateArray: any[] = []
  for (const id in scoreArray) {
    const relativeScore = scoreArray[id].relativeBrierScore
    const absoluteScore = scoreArray[id].absoluteBrierScore
    const rank = scoreArray[id].rank
    let userQuestionComboId = `${id}-${question.id}`
    updateArray.push(
      prisma.questionScore.upsert({
        where: {
          userQuestionComboId: userQuestionComboId,
        },
        update: {
          relativeScore: relativeScore,
          absoluteScore: absoluteScore,
          rank: rank,
        },
        create: {
          userQuestionComboId: userQuestionComboId,
          userId: id,
          questionId: question.id,
          relativeScore: relativeScore,
          absoluteScore: absoluteScore,
          rank: rank,
        },
      }),
    )
    console.log(`  user id: ${id} with relative score ${relativeScore}`)
  }
  await prisma.$transaction(updateArray)
}

function getAverageScores(questionScores: QuestionScore[]) {
  const avgRelativeScore = averageScores(
    questionScores.map((score) => score.relativeScore?.toNumber()),
  )

  const avgAbsoluteScore = averageScores(
    questionScores.map((score) => score.absoluteScore.toNumber()),
  )

  return {
    avgRelativeScore: avgRelativeScore,
    avgAbsoluteScore: avgAbsoluteScore,
  }
}

async function messageUsers(
  scoreArray: ScoreCollection,
  question: QuestionWithQuestionMessagesAndForecastWithUserWithProfiles,
) {
  console.log(`messageUsers for question id: ${question.id}`)

  console.log("get profiles")
  const profiles = await prisma.profile.findMany({
    where: {
      id: {
        in: question.forecasts
          .filter((f) => f.profileId !== null)
          .map((f) => f.profileId!),
      },
      slackId: {
        not: null,
      },
      slackTeamId: {
        not: null,
      },
    },
    include: {
      user: {
        include: {
          forecasts: {
            where: {
              questionId: question.id,
            },
          },
          questionScores: true,
        },
      },
    },
  })

  console.log("Messaging profiles ", profiles)

  // go over each profile and send a message to each workspace they are in which
  //   are also in the question's workspace
  const newMessageDetails = await Promise.all(
    profiles.map(async (profile) => {
      const user = profile.user
      // sort the forecasts
      const sortedUserForecasts = user.forecasts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )
      const lastForecast = sortedUserForecasts[0]
      const averageScores = getAverageScores(user.questionScores)
      const scoreDetails = {
        brierScore: scoreArray[user.id].absoluteBrierScore,
        rBrierScore: scoreArray[user.id].relativeBrierScore,
        ranking: scoreArray[user.id].rank,
        totalParticipants: Object.keys(scoreArray).length,
        lastForecast: lastForecast.forecast.toNumber() * 100,
        lastForecastDate: getDateSlackFormat(
          lastForecast.createdAt,
          true,
          "date_short_pretty",
        ),
        overallBrierScore: averageScores.avgAbsoluteScore,
        overallRBrierScore: averageScores.avgRelativeScore,
      }
      const brierScore =
        scoreDetails.rBrierScore == undefined
          ? scoreDetails.brierScore
          : scoreDetails.rBrierScore
      const message =
        `'${question.title}' resolved ${getResolutionEmoji(
          question.resolution,
        )} ${question.resolution}. ` +
        (question.resolution === "AMBIGUOUS"
          ? ""
          : `Your ${
              scoreDetails.rBrierScore == undefined ? "relative " : ""
            }Brier score is ${round(brierScore, 4)}`)

      const blocks = await buildQuestionResolvedBlocks(
        profile.slackTeamId!,
        question,
        scoreDetails,
        getTarget(user.id) != null,
      )
      const data = await postBlockMessage(
        profile.slackTeamId!,
        profile.slackId!,
        blocks,
        message,
        { unfurl_links: false, unfurl_media: false },
      )
      if (!data?.ts || !data?.channel) {
        console.error(
          `Missing message.ts or message.channel in response ${JSON.stringify(
            data,
          )}`,
        )
        throw new Error("Missing message.ts or message.channel in response")
      }
      return {
        id: -1,
        ts: data.ts,
        channel: data.channel!,
        teamId: profile.slackTeamId!,
        profileId: profile.id,
      }
    }),
  )

  await replaceQuestionResolveMessages(question, newMessageDetails.flat())
}

type SlackMessageWithProfileId = SlackMessage & { profileId: number }

async function replaceQuestionResolveMessages(
  question: Question,
  newMessageDetails: SlackMessageWithProfileId[],
) {
  console.log(`addQuestionResolveMessages for question id: ${question.id}`)
  await prisma.question.update({
    where: {
      id: question.id,
    },
    data: {
      resolutionMessages: {
        create: newMessageDetails.map((message) => {
          return {
            message: {
              create: {
                ts: message.ts,
                channel: message.channel,
                teamId: message.teamId,
              },
            },
            profile: {
              connect: {
                id: message.profileId,
              },
            },
          }
        }),
      },
    },
  })
}

export async function handleQuestionResolution(
  questionId: string,
  resolution: string,
  questionType: QuestionType,
) {
  console.log(`    handleQuestionResolution: ${questionId} ${resolution}`)
  let resolutionValue: Resolution

  if (Object.values(Resolution).includes(resolution as Resolution)) {
    resolutionValue = resolution as Resolution
  } else {
    resolutionValue = Resolution.YES
  }

  console.log(`resolutionValue: ${resolutionValue}`)

  const question = await dbResolveQuestion(questionId, resolutionValue)
  console.log(
    `    handledUpdateQuestionResolution: ${questionId} ${resolution}`,
  )

  // update ping and question message first for responsiveness
  await updateResolvePingQuestionMessages(question, "Question resolved!")

  let scores: ScoreCollection

  if (questionType === QuestionType.BINARY) {
    scores = await scoreQuestion(resolution as Resolution, question)
  } else {
    const result = await dbResolveQuestionOption(questionId, resolution)
    scores = await scoreQuestionOptions(resolution, result)
  }

  await messageUsers(scores, question)

  await updateForecastQuestionMessages(question, "Question resolved!")

  await sendResolutionBroadcast(question)

  const q = question
  // for now, just do it if not shared to slack
  // in future check per user if they forecasted via slack maybe
  if (q.questionMessages.length === 0) {
    for (const user of filterToUniqueIds([
      q.user,
      ...q.forecasts.map((f) => f.user),
      ...q.comments.map((c) => c.user),
      ...q.sharedWith,
      ...q.sharedWithLists.flatMap((l) => l.users),
    ]).filter((u) => u && u.id !== q.userId)) {
      await createNotification({
        userId: user.id,
        title: `${q.user.name || "Someone"} resolved ${q.resolution}: "${
          q.title
        }"`,
        content: `${q.user.name || "Someone"} resolved ${
          q.resolution
        }: ${getMarkdownLinkQuestionTitle(q)}`,
        tags: ["question_resolved", q.id],
        url: getQuestionUrl(q),
      })
    }
  }
}

export async function scoreQuestion(
  resolution: Resolution,
  question: QuestionWithForecastsAndScores,
) {
  let scores: ScoreCollection = {}
  if (resolution != Resolution.AMBIGUOUS) {
    console.log("Question is unambig")
    scores = relativeBrierScoring(question.forecasts, question)
    await scoreForecasts(scores, question)
  } else {
    let uniqueIds = Array.from(new Set(question.forecasts.map((f) => f.userId)))
    scores = uniqueIds
      .map((id) => {
        return {
          [id]: {
            absoluteBrierScore: 0,
            relativeBrierScore: 0,
            rank: 0,
          } as ScoreTuple,
        }
      })
      .reduce((a, b) => Object.assign(a, b), {})
  }
  return scores
}

function generateImplicitForecasts(
  question: QuestionWithForecastsAndOptionsAndScores,
): Forecast[] {
  // pull out all users
  // for each user, go through their forecasts and generate the implict ones
  // append all of them
  const implicitForecasts: Forecast[] = []

  const uniqueUserIds = Array.from(
    new Set(question.forecasts.map((f) => f.userId)),
  )

  uniqueUserIds.forEach((userId) => {
    implicitForecasts.push(
      ...generateImplicitForecastsForUser(question, userId),
    )
  })

  return implicitForecasts
}

function generateImplicitForecastsForUser(
  question: QuestionWithForecastsAndOptionsAndScores,
  userId: string,
): Forecast[] {
  // Get all forecasts for this user
  const userForecasts: Forecast[] = question.forecasts.filter(
    (f) => f.userId === userId,
  )
  const groupedForecasts = Object.groupBy(userForecasts, (forecast) =>
    forecast.createdAt.getTime().toString(),
  )
  const implicitUserForecasts: Forecast[] = []

  const scores: { [key: string]: Decimal } = {}

  question.options.forEach((option) => {
    scores[option.id] = new Decimal(0)
  })

  Object.keys(groupedForecasts).forEach((date) => {
    const forecastsForDate = groupedForecasts[date]
    console.log(`Processing forecasts for date: ${date}`)
    forecastsForDate!.forEach((forecast) => {
      // Perform operations on each forecast in the group
      if (forecast.optionId) {
        scores[forecast.optionId] = forecast.forecast
      } else {
        throw Error("OptionId is null for forecast")
      }
    })

    // Generate implicit forecast for each date
    const impliedForecast = new Decimal(
      Math.max(
        0,
        1 -
          Object.values(scores).reduce(
            (sum, forecast) => sum + forecast.toNumber(),
            0,
          ),
      ),
    )
    implicitUserForecasts.push({
      id: Math.random(),
      createdAt: new Date(Number(date)),
      forecast: impliedForecast,
      userId: userId,
      questionId: question.id,
      optionId: null,
      comment: null,
      profileId: userForecasts[0].profileId,
    })
  })
  return implicitUserForecasts
}

export async function scoreQuestionOptions(
  resolution: string,
  question: QuestionWithForecastsAndOptionsAndScores,
) {
  // send only the relevant forecast to the scoring function
  let scores: ScoreCollection = {}
  if (resolution != Resolution.AMBIGUOUS) {
    console.log("Question is unambig")

    if (resolution == "OTHER") {
      console.log("Question resolving to OTHER")

      const implicitForecasts = generateImplicitForecasts(question)

      scores = relativeBrierScoring(implicitForecasts, question)
    } else {
      // Find the option that resolved to YES, and then resolve it as a binary question
      const resolvedOption = question.options.find(
        (option) => option.text === resolution,
      )
      console.log({ resolvedOption })

      if (!resolvedOption) {
        throw Error(
          "scoreQuestionOptions: resolution not found in question options",
        )
      }

      scores = relativeBrierScoring(resolvedOption?.forecasts, resolvedOption)
    }

    // scores = relativeBrierScoring(question.forecasts, question)
    await scoreForecasts(scores, question)
  } else {
    let uniqueIds = Array.from(new Set(question.forecasts.map((f) => f.userId)))
    scores = uniqueIds
      .map((id) => {
        return {
          [id]: {
            absoluteBrierScore: 0,
            relativeBrierScore: 0,
            rank: 0,
          } as ScoreTuple,
        }
      })
      .reduce((a, b) => Object.assign(a, b), {})
  }
  return scores
}

export async function resolve(
  actionParts: ResolveQuestionActionParts,
  responseUrl?: string,
  userSlackId?: string,
  actionValue?: string,
  connectingTeamId?: string,
) {
  // actionParts.answer is set by buttons block in resolution reminder DM, actionValue is set by select block on question
  const answer = actionParts.answer || actionValue
  if (!answer)
    throw Error(
      "blockActions: both payload.actions.answer and actionValue is undefined",
    )
  else if (
    actionParts.questionId === undefined ||
    userSlackId === undefined ||
    connectingTeamId === undefined ||
    responseUrl === undefined
  )
    throw Error("blockActions: missing param")

  const { questionId } = actionParts
  console.log(`  resolve question ${questionId} to ${answer}`)

  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
    },
  })

  if (!question) {
    console.error("Couldn't find question to resolve: ", questionId)
    await postMessageToResponseUrl(
      {
        text: `Error: Couldn't find question to resolve.`,
        replace_original: false,
        response_type: "ephemeral",
      },
      responseUrl,
    )
    throw new Error(`Couldn't find question ${questionId}`)
  }

  if (!question.user.profiles.some((p) => p.slackId === userSlackId)) {
    // user is not the author of the question
    await postMessageToResponseUrl(
      {
        text: `Only the question's author ${getUserNameOrProfileLink(
          connectingTeamId,
          question.user,
        )} can resolve it.`,
        replace_original: false,
        response_type: "ephemeral",
      },
      responseUrl,
    )
    return
  }

  // TODO:NEAT replace yes/no/ambiguous with enum (with check for resolution template)
  switch (answer) {
    case "yes":
      await handleQuestionResolution(
        questionId,
        Resolution.YES,
        QuestionType.BINARY,
      )
      break
    case "no":
      await handleQuestionResolution(
        questionId,
        Resolution.NO,
        QuestionType.BINARY,
      )
      break
    case "ambiguous":
      await handleQuestionResolution(
        questionId,
        Resolution.AMBIGUOUS,
        QuestionType.BINARY,
      )
      break
    default:
      console.error("Unhandled resolution: ", answer)
      throw new Error("Unhandled resolution")
  }

  await backendAnalyticsEvent("question_resolved", {
    platform: "slack",
    team: connectingTeamId,
    resolution: answer,
  })
}

export async function buttonUndoResolution(
  actionParts: UndoResolveActionParts,
  payload: BlockActionPayload,
) {
  const questionId = actionParts.questionId
  if (!questionId) {
    throw Error("blockActions: payload.actions.questionId is undefined")
  }
  if (!payload.team?.id || !payload.user?.id || !payload.channel?.id) {
    throw new Error(
      "Missing team or user or channel id on question overflow > undo_resolve",
    )
  }
  if (
    await slackUserCanUndoResolution(
      questionId,
      payload.team.id,
      payload.user.id,
      payload.channel.id,
    )
  ) {
    await undoQuestionResolution(questionId)
    await backendAnalyticsEvent("question_resolution_undone", {
      platform: "slack",
      team: payload.team.id,
    })
  }
}

export async function slackUserCanUndoResolution(
  questionId: string,
  teamId: string,
  userSlackId: string,
  channelId: string,
) {
  const questionPreUpdate = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
    },
  })

  if (!questionPreUpdate?.user.profiles.find((p) => p.slackId == userSlackId)) {
    console.log("Can't undo resolution, not author")
    await postEphemeralSlackMessage(teamId, {
      text: `Only the question's author ${
        questionPreUpdate
          ? getUserNameOrProfileLink(teamId, questionPreUpdate?.user)
          : ""
      } can undo a resolution.`,
      channel: channelId,
      user: userSlackId,
    })
    return false
  }

  return true
}

export async function undoQuestionResolution(questionId: string) {
  await prisma.$transaction([
    prisma.question.update({
      where: {
        id: questionId,
      },
      data: {
        resolution: null,
        resolvedAt: null,
        resolved: false,
      },
    }),
    prisma.questionScore.deleteMany({
      where: {
        questionId: questionId,
      },
    }),
  ])

  const questionUpdated = await prisma.question.findUnique({
    where: {
      id: questionId,
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
      pingResolveMessages: {
        include: {
          message: true,
        },
      },
    },
  })
  if (!questionUpdated) {
    throw Error(`Cannot find question with id: ${questionId}`)
  }
  await updateForecastQuestionMessages(
    questionUpdated,
    "Question resolution undone!",
  )
  await updateResolvePingQuestionMessages(
    questionUpdated,
    "Question resolution undone!",
  )
  await updateResolutionQuestionMessages(
    questionUpdated,
    "Question resolution undone!",
  )
}

async function sendResolutionBroadcast(
  question: QuestionWithAuthorAndQuestionMessages,
) {
  for (let i = 0; i < question.questionMessages.length; i++) {
    const message = question.questionMessages[i]
    await postBlockMessage(
      message.message.teamId,
      message.message.channel,
      await buildQuestionResolvedBroadcastBlocks(
        question,
        message.message.teamId,
      ),
      `Resolved ${question.resolution}: ${question.title.substring(0, 300)}`,
      {
        unfurl_links: false,
        unfurl_media: false,
      },
    )
  }
}
