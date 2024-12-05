import { Tournament, User, UserList } from "@prisma/client"
import { QuestionWithTournamentsAndLists } from "../../prisma/additional"
import {
  deleteMessage,
  getOrCreateProfile,
  postEphemeralTextMessage,
  postSlackMessage,
} from "../_utils_server"
import { buildQuestionBlocks } from "../blocks-designs/question"
import prisma from "../prisma"
import { assertHasAccess } from "../web/question_router"
import { getQuestionIdFromUrl } from "../web/question_url"
import { getTournamentUrl, getUserListUrl } from "../web/utils"

export async function postFromWeb(
  relativePath: string,
  teamId?: string,
  channelId?: string,
  slackUserId?: string,
) {
  if (!teamId || !channelId || !slackUserId) {
    throw new Error(
      `Missing teamId, channelId, or slackUserId ${{
        teamId,
        channelId,
        slackUserId,
      }}`,
    )
  }

  if (relativePath.startsWith("/q/")) {
    const id = getQuestionIdFromUrl(relativePath)

    if (!id) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "It looks like there's a problem with the URL you pasted.",
      )
    }

    const profile = await getOrCreateProfile(teamId, slackUserId)
    try {
      await postQuestionToSlack({
        questionId: id,
        teamId,
        channelId,
        user: profile.user,
        slackUserId,
      })
    } catch (e) {
      console.log(e)
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "We couldn't find a question at that URL.",
      )
    }
  } else if (
    ["tournament", "predict-your-year"].some((path) =>
      relativePath.startsWith(`/${path}/`),
    )
  ) {
    const id = getQuestionIdFromUrl(relativePath)

    if (!id) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "It looks like there's a problem with the URL you pasted.",
      )
    }

    const profile = await getOrCreateProfile(teamId, slackUserId)
    const user = profile.user
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        author: true,
        questions: true,
        userList: {
          include: {
            users: true,
          },
        },
      },
    })
    if (!tournament) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "We couldn't find a tournament at that URL.",
      )
    }

    if (
      tournament.authorId !== user.id &&
      !(
        tournament.anyoneInListCanEdit &&
        tournament.userList?.users.some((u) => u.id === user.id)
      )
    ) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        `You don't have permission to edit that tournament. Ask ${
          tournament.author.name || "its creator"
        }.`,
      )
    }

    if (tournament.syncToSlackChannelId || tournament.syncToSlackTeamId) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        `That tournament is already synced to a Slack channel, <#${tournament.syncToSlackChannelId}>.`,
      )
    }

    console.log("syncing tournament ", tournament)
    await prisma.tournament.update({
      where: { id },
      data: {
        syncToSlackChannelId: channelId,
        syncToSlackTeamId: teamId,
      },
    })

    await postSlackMessage(
      teamId,
      {
        channel: channelId,
        text: `<@${slackUserId}> has started synced their forecasting tournament to this channel: *<${getTournamentUrl(
          tournament,
          false,
        )}|${tournament.name}>*. New questions will be posted here.`,
      },
      slackUserId,
    )
    console.log("initial question sync")
    for (const question of tournament.questions) {
      console.log("posting question to slack ", question.id)
      await postQuestionToSlack({
        questionId: question.id,
        teamId,
        channelId,
        user,
        slackUserId,
      })
      await new Promise((r) => setTimeout(r, 1000)) // avoid rate limits
    }
    console.log("initial question sync complete")
  } else if (relativePath.startsWith("/team/")) {
    const id = getQuestionIdFromUrl(relativePath)

    if (!id) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "It looks like there's a problem with the URL you pasted.",
      )
    }

    const profile = await getOrCreateProfile(teamId, slackUserId)
    const user = profile.user
    const userList = await prisma.userList.findUnique({
      where: { id },
      include: {
        author: true,
        questions: true,
      },
    })
    if (!userList) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        "We couldn't find a team at that URL.",
      )
    }

    if (userList.authorId !== user.id) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        `You don't have permission to edit that team. Ask ${
          userList.author.name || "its creator"
        }.`,
      )
    }

    if (userList.syncToSlackChannelId || userList.syncToSlackTeamId) {
      return await postEphemeralTextMessage(
        teamId,
        channelId,
        slackUserId,
        `That team is already synced to a Slack channel, <#${userList.syncToSlackChannelId}>.`,
      )
    }

    console.log("syncing team ", userList)
    await prisma.userList.update({
      where: { id },
      data: {
        syncToSlackChannelId: channelId,
        syncToSlackTeamId: teamId,
      },
    })

    await postSlackMessage(
      teamId,
      {
        channel: channelId,
        text: `<@${slackUserId}> has started synced their Fatebook team to this channel: *<${getUserListUrl(
          userList,
          false,
        )}|${
          userList.name
        }>*. Forecasting questions shared with that team will be posted here.`,
        unfurl_links: false,
        unfurl_media: false,
      },
      slackUserId,
    )
    console.log("initial question sync")
    for (const question of userList.questions) {
      console.log("posting question to slack ", question.id)
      await postQuestionToSlack({
        questionId: question.id,
        teamId,
        channelId,
        user,
        slackUserId,
      })
      await new Promise((r) => setTimeout(r, 1000)) // avoid rate limits
    }
    console.log("initial question sync complete")
  } else {
    await postEphemeralTextMessage(
      teamId,
      channelId,
      slackUserId,
      "We couldn't find a question, tournament or team at that URL.",
    )
  }
}

// jank: removeFromEntities should still have their channel and team ids set, so that we can delete messages from them
export async function syncToSlackIfNeeded(
  question: QuestionWithTournamentsAndLists,
  userId: string | undefined,
  removeFromEntitiesThatStillHaveSlackIds?: (UserList | Tournament)[],
) {
  for (const entity of [...question.tournaments, ...question.sharedWithLists]) {
    if (entity.syncToSlackChannelId && entity.syncToSlackTeamId) {
      const user = await prisma.user.findUnique({
        where: { id: userId || "NO MATCH" },
      })
      if (user) {
        try {
          await postQuestionToSlack({
            questionId: question.id,
            teamId: entity.syncToSlackTeamId,
            channelId: entity.syncToSlackChannelId,
            user,
          })
        } catch (error) {
          if (error instanceof Error && error.message.includes("is_archived")) {
            throw new Error("slackSyncError: Channel is archived")
          }
          throw error
        }
      }
    }
  }

  for (const entity of removeFromEntitiesThatStillHaveSlackIds || []) {
    if (entity.syncToSlackChannelId && entity.syncToSlackTeamId) {
      // TODO check if there are other reasons to sync to this channel (in which case, don't delete messages)

      // delete slack messages from removeFromEntities
      const slackMessages = await prisma.questionSlackMessage.findMany({
        where: {
          questionId: question.id,
          message: {
            channel: entity.syncToSlackChannelId,
            teamId: entity.syncToSlackTeamId,
          },
        },
        include: {
          message: true,
        },
      })

      for (const slackMessage of slackMessages) {
        await deleteMessage(
          slackMessage.message.teamId,
          slackMessage.message.channel,
          slackMessage.message.ts,
        )
        await prisma.questionSlackMessage.delete({
          where: {
            id: slackMessage.id,
          },
        })
      }
    }
  }
}

export async function postQuestionToSlack({
  questionId,
  teamId,
  channelId,
  user,
  slackUserId,
}: {
  questionId: string
  teamId: string
  channelId: string
  user: User
  slackUserId?: string
}) {
  const alreadyPosted = await prisma.questionSlackMessage.findFirst({
    where: {
      questionId,
      message: {
        channel: channelId,
        teamId: teamId,
      },
    },
  })
  if (alreadyPosted) {
    console.log("Question already posted to Slack")
    return
  }
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
      sharedWith: true,
      sharedWithLists: {
        include: {
          author: true,
          users: {
            include: {
              profiles: true,
            },
          },
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

  assertHasAccess(question, user)

  if (!question) {
    throw new Error()
  }

  const data = await postSlackMessage(
    teamId,
    {
      channel: channelId,
      text: `Forecasting question shared: ${question.title}`,
      blocks: await buildQuestionBlocks(teamId, question),
      unfurl_links: false,
      unfurl_media: false,
    },
    slackUserId,
  )

  if (!data.ts) {
    throw new Error("No ts returned from Slack")
  }

  await prisma.question.update({
    where: {
      id: question.id,
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
}
