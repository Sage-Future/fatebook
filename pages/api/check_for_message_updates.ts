import { VercelRequest, VercelResponse } from "@vercel/node"

import { Question, Target, User } from "@prisma/client"
import { conciseDateTime } from "../../lib/_utils_common"
import {
  getCurrentTargetProgress,
  postBlockMessage,
  updateForecastQuestionMessages,
} from "../../lib/_utils_server"
import { buildResolveQuestionBlocks } from "../../lib/blocks-designs/resolve_question"
import { buildStaleForecastsReminderBlock } from "../../lib/blocks-designs/stale_forecasts"
import { buildTargetNotification } from "../../lib/blocks-designs/target_setting"
import prisma from "../../lib/prisma"
import { sendWelcomeEmail } from "../../lib/web/drip_emails"
import {
  createNotification,
  fatebookEmailFooter,
  sendEmailUnbatched,
} from "../../lib/web/notifications"
import { getQuestionUrl } from "../../lib/web/question_url"
import { getHtmlLinkQuestionTitle } from "../../lib/web/utils"
import {
  ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts,
  ForecastWithQuestionWithSlackMessagesAndForecasts,
} from "../../prisma/additional"

export const config = {
  maxDuration: 300,
}

async function getTargetsToBeNotified() {
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  return await prisma.target.findMany({
    where: {
      lastNotified: {
        lte: lastWeek,
      },
    },
    include: {
      profile: true,
      user: {
        include: {
          accounts: true,
        },
      },
    },
  })
}

async function sendSlackTargetNotification(
  target: Target,
  slackTeamId: string,
  slackId: string,
) {
  const current = await getCurrentTargetProgress(target.userId, target)
  const blocks = buildTargetNotification(target, current)

  if (current < target.goal) {
    await prisma.target.update({
      where: {
        id: target.id,
      },
      data: {
        lastFailedAt: new Date(),
        lastNotified: new Date(),
      },
    })
  } else {
    await prisma.target.update({
      where: {
        id: target.id,
      },
      data: {
        lastNotified: new Date(),
      },
    })
  }

  await postBlockMessage(slackTeamId, slackId, blocks)
}

async function sendTargetMessages() {
  const targetsToBeNotified = await getTargetsToBeNotified()
  for (const target of targetsToBeNotified) {
    if (
      target.profile &&
      target.profile.slackTeamId &&
      target.profile.slackId
    ) {
      try {
        await sendSlackTargetNotification(
          target,
          target.profile.slackTeamId,
          target.profile.slackId,
        )
      } catch (err) {
        console.error(
          `Error sending message on target ${target.id}: \n${err}\nContinuing...`,
        )
      }
    } else if (target.user.accounts.length > 0) {
      // await sendEmailTargetNotification(user)
      console.error("Email notifications not set for targets", target.id)
    } else {
      console.error("No profile or accounts found for target", target.id)
    }
  }
  return targetsToBeNotified
}

async function getQuestionsToBeResolved() {
  // check if any questions need to be resolved by time
  const allQuestionsToBeNotified = await prisma.question.findMany({
    where: {
      resolveBy: {
        lte: new Date(),
      },
      resolved: false,
      pingedForResolution: false,
    },
    include: {
      profile: true,
      user: {
        include: {
          profiles: true,
          accounts: true,
        },
      },
      questionMessages: {
        include: {
          message: true,
        },
      },
    },
  })
  return allQuestionsToBeNotified
}

async function notifyAuthorsToResolveQuestions() {
  const allQuestionsToBeNotified = await getQuestionsToBeResolved()

  for (const question of allQuestionsToBeNotified) {
    try {
      if (question.profile) {
        await sendSlackReadyToResolveNotification(question)
      } else if (question.user.accounts.length > 0) {
        // only email notify Fatebook web users, and only about questions they haven't shared to Slack
        await sendEmailReadyToResolveNotification(question)
      } else {
        console.error(
          "No profile or accounts found for question",
          question.id,
          question.user.name,
        )
      }
    } catch (err) {
      console.error(
        `Error sending message on question ${question.id}: \n${err}\nContinuing...`,
      )
    }
  }
  return allQuestionsToBeNotified
}

export async function sendEmailReadyToResolveNotification(
  question: Question & { user: User },
) {
  await createNotification({
    title: `Ready to resolve: ${question.title}`,
    content: `Are you ready to resolve your question: ${question.title}`,
    url: getQuestionUrl(question),
    tags: ["ready_to_resolve"],
    userId: question.userId,
    questionId: question.id,
  })

  await prisma.question.update({
    where: {
      id: question.id,
    },
    data: {
      pingedForResolution: true,
    },
  })
}

async function sendSlackReadyToResolveNotification(
  question: Awaited<ReturnType<typeof getQuestionsToBeResolved>>[number],
) {
  if (!question.profile) {
    console.error(
      `No profile found for question ${question.id}, author ${question.user.name}. Todo add email notification instead`,
    )
    return
  }

  const slackTeamId = question.profile.slackTeamId
  if (!slackTeamId) {
    console.error(`No slack team id found for question ${question.id}`)
    return
  }
  const slackId = question.profile.slackId!
  try {
    const resolveQuestionBlock = await buildResolveQuestionBlocks(
      slackTeamId,
      question,
    )
    const data = await postBlockMessage(
      slackTeamId,
      slackId,
      resolveQuestionBlock,
      `Ready to resolve your question? "${question.title.substring(0, 250)}"`,
      { unfurl_links: false, unfurl_media: false },
    )

    if (!data?.ts || !data?.channel) {
      console.error(
        `Missing message.ts or channel in response ${JSON.stringify(data)}`,
      )
      throw new Error("Missing message.ts or channel in response")
    }

    console.log(
      `Sent message to ${question.profile.slackId} for question ${question.id}`,
    )

    // OPTIMISATION:: move these intro a transaction
    await prisma.question.update({
      where: {
        id: question.id,
      },
      data: {
        pingedForResolution: true,
        pingResolveMessages: {
          create: {
            message: {
              create: {
                ts: data.ts,
                teamId: slackTeamId,
                channel: data.channel,
              },
            },
          },
        },
      },
    })

    console.log(`Updated question ${question.id} to pingedForResolution`)
  } catch (err) {
    console.error(`Error sending message on question ${question.id}: \n${err}`)
  }
}

async function updateQuestionsToUnhideForecasts() {
  const now = new Date()
  const LAST_X_DAYS = 7
  console.log(
    `Checking for questions to unhide forecasts for between ${conciseDateTime(
      now,
    )} ${conciseDateTime(
      new Date(now.getTime() - LAST_X_DAYS * 24 * 60 * 60 * 1000),
    )}`,
  )
  const questionsToCheck = await prisma.question.findMany({
    where: {
      hideForecastsUntil: {
        lte: now,
        gte: new Date(now.getTime() - LAST_X_DAYS * 24 * 60 * 60 * 1000),
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

  // if the date of any message last updated is before the hideForecastsUntil date
  //   then needs to be updated
  const questionsToBeUpdated = questionsToCheck.filter(
    (question) =>
      question.questionMessages.filter(
        (qm) =>
          question.hideForecastsUntil &&
          qm.updatedAt < question.hideForecastsUntil,
      ).length > 0,
  )

  for (const question of questionsToBeUpdated) {
    try {
      await updateForecastQuestionMessages(question, "Forecasts unhidden")
      await prisma.questionSlackMessage.updateMany({
        // select all ids of question messages that are in the question
        where: {
          id: {
            in: question.questionMessages.map((qm) => qm.id),
          },
        },
        data: {
          updatedAt: new Date(),
        },
      })
    } catch (e) {
      console.error(
        `Could not update question ${question.id}: ${e}\nContinuing...`,
      )
    }
  }

  return questionsToBeUpdated
}

async function getStaleForecasts() {
  // get all forecasts that were made exactly 2 weeks ago
  const LAST_X_DAYS = 14
  const now = new Date()
  const startDate = new Date(now.getTime() - LAST_X_DAYS * 24 * 60 * 60 * 1000)
  const endDate = new Date(
    now.getTime() - (LAST_X_DAYS - 1) * 24 * 60 * 60 * 1000,
  )

  const forecasts = await prisma.forecast.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      question: {
        resolved: false,
        resolveBy: {
          gte: now,
        },
      },
      user: {
        staleReminder: true,
      },
    },
    include: {
      question: {
        include: {
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
          forecasts: true,
        },
      },
      user: {
        include: {
          accounts: true,
        },
      },
      profile: true,
    },
  })

  return forecasts.filter((staleForecast) => {
    // if there are no forecasts for this question that are more recent than this one
    //   for this user, then this forecast is stale
    return (
      staleForecast.question.forecasts
        .filter((forecast) => forecast.userId == staleForecast.userId)
        .filter((forecast) => {
          return forecast.createdAt > staleForecast.createdAt
        }).length === 0
    )
  })
}

async function messageStaleForecasts() {
  const staleForecasts = await getStaleForecasts()

  const allUsers = staleForecasts.map((staleForecast) => staleForecast.user)
  // get unique by id
  const staleForecastUsers = Array.from(
    new Set(allUsers.map((user) => user.id)),
  )

  for (const userIdWithStaleForecasts of staleForecastUsers) {
    // get staleForecasts of user
    const staleForecastsForUser = staleForecasts.filter(
      (staleForecast) => staleForecast.user.id === userIdWithStaleForecasts,
    )
    const staleForecastProfileIds = Array.from(
      new Set(
        staleForecastsForUser.map((staleForecast) => staleForecast.profile?.id),
      ),
    )
    const staleForecastProfiles = staleForecastProfileIds
      .map(
        (profileId) =>
          staleForecastsForUser.find(
            (staleForecast) => staleForecast.profile?.id === profileId,
          )?.profile,
      )
      .filter((profile) => profile !== undefined)
    for (const staleForecastProfile of staleForecastProfiles) {
      const staleForecastsForProfile = staleForecastsForUser.filter(
        (staleForecast) =>
          staleForecast.profile?.id === staleForecastProfile?.id,
      )
      if (
        staleForecastProfile &&
        staleForecastProfile.slackTeamId &&
        staleForecastProfile.slackId
      ) {
        await sendSlackstaleForecastNotification(
          staleForecastsForProfile,
          staleForecastProfile.slackTeamId,
          staleForecastProfile.slackId,
        )
      } else {
        const user = allUsers.find(
          (user) => user.id == userIdWithStaleForecasts,
        )
        if (user && user.accounts.length > 0) {
          try {
            await sendEmailForStaleForecasts(staleForecastsForProfile, user)
          } catch (e) {
            console.error(
              `Could not send email for ${staleForecastsForProfile.length} stale forecasts for user ${user.id}: ${e}\nContinuing...`,
            )
          }
        } else {
          console.error(
            "No profile or accounts found for user",
            userIdWithStaleForecasts,
          )
        }
      }
    }
  }
  return staleForecastUsers
}

async function sendEmailForStaleForecasts(
  staleForecastsForProfile: ForecastWithQuestionWithSlackMessagesAndForecasts[],
  user: User,
) {
  if (staleForecastsForProfile.length > 0) {
    await sendEmailUnbatched({
      subject:
        `It's two weeks since you predicted on '${staleForecastsForProfile[0].question.title}'` +
        (staleForecastsForProfile.length > 1
          ? ` and ${staleForecastsForProfile.length - 1} other questions`
          : ""),
      to: user.email,
      textBody: `Do you want to update your forecasts?`,
      htmlBody:
        `<p>You have some forecasts you may want to update:</p>` +
        staleForecastsForProfile
          .map(
            (staleForecast) =>
              "<p>• " +
              getHtmlLinkQuestionTitle(staleForecast.question) +
              "</p>",
          )
          .join("\n") +
        `\n\n${fatebookEmailFooter()}`,
    })
  }
}

async function sendSlackstaleForecastNotification(
  staleForecasts: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts[],
  slackTeamId: string,
  slackId: string,
) {
  await postBlockMessage(
    slackTeamId,
    slackId,
    await buildStaleForecastsReminderBlock(staleForecasts, slackTeamId),
    "You have some forecasts you may want to update",
    {
      unfurl_links: false,
      unfurl_media: false,
    },
  )
}

async function sendWelcomeEmailToNewUsers() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const newUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gt: twentyFourHoursAgo,
      },
      unsubscribedFromEmailsAt: null,
    },
  })
  console.log(`Sending welcome email to ${newUsers.length} new users`)
  for (const user of newUsers) {
    await sendWelcomeEmail(user)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (
    ((process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test") &&
      !process.env.DATABASE_URL?.includes("supabase")) ||
    req.query.key !== process.env.CHECK_UPDATES_KEY
  ) {
    console.error(
      "Not in production, no operation on non-supabase db. Or - not using correct key. Make a debug function that restricts these functions to a specific workspace.",
    )
    res.status(403).json({ error: "Invalid authorisation or environment." })
    return
  }

  // wrap everything in a try catch so that if one fails, the others still run
  let allQuestionsToBeNotified,
    questionsToBeUpdated,
    targetMessages,
    staleForecastMessages
  try {
    allQuestionsToBeNotified = await notifyAuthorsToResolveQuestions()
  } catch (e) {
    console.error(e)
  }
  try {
    questionsToBeUpdated = await updateQuestionsToUnhideForecasts()
  } catch (e) {
    console.error(e)
  }
  try {
    targetMessages = await sendTargetMessages()
  } catch (e) {
    console.error(e)
  }
  try {
    staleForecastMessages = await messageStaleForecasts()
  } catch (e) {
    console.error(e)
  }
  try {
    await sendWelcomeEmailToNewUsers()
  } catch (e) {
    console.error(e)
  }
  res.json({
    questionsToBeUpdated,
    allQuestionsToBeNotified,
    targetMessages,
    staleForecastMessages,
  })
}
