import { User } from "@prisma/client"
import { VercelRequest, VercelResponse } from "@vercel/node"
import * as chrono from "chrono-node"
import { InteractionResponseType, InteractionType } from "discord-interactions"
import { backendAnalyticsEvent } from "../../../lib/_utils_server"
import { sendDiscordEphemeral } from "../../../lib/discord/utils"
import prisma from "../../../lib/prisma"
import { getQuestionUrl } from "../../../lib/web/question_url"
import { truncateString } from "../../../lib/web/utils"
import { QuestionWithUserAndForecasts } from "../../../prisma/additional"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Handling interaction")

  const { type, data } = req.body

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG })
  }

  /**
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data

    if (name === "test") {
      return sendDiscordEphemeral(res, "Tested!")
    }

    if (name === "forecast") {
      const user = await getFatebookUser(req)
      if (!user) {
        return showApiInputModal(res)
      }
      await createForecast(req, res, user)
    }
  }

  if (type === InteractionType.MODAL_SUBMIT) {
    if (data.custom_id === "login_modal") {
      return await handleLoginModalSubmit(req, res)
    }
  }

  if (!res.headersSent) {
    console.log("Interaction not handled! Sending 'ok'")
    res.send("ok")
  }
}

async function createForecast(
  req: VercelRequest,
  res: VercelResponse,
  user: User,
) {
  const title = req.body.data.options?.[0]?.value
  const resolveByStr = req.body.data.options?.[1]?.value
  const prediction = req.body.data.options?.[2]?.value as number

  const youSaid = `\nYou said: /forecast ${title} ${resolveByStr} ${prediction}`

  if (!title || !resolveByStr || prediction == undefined) {
    return sendDiscordEphemeral(
      res,
      "Please provide a question, resolve by date, and prediction" + youSaid,
    )
  }

  const dateResult = chrono.parse(resolveByStr, new Date(), {
    forwardDate: true,
  })
  if (!dateResult || dateResult.length === 0) {
    const year = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).getFullYear() // 60 days from now
    return sendDiscordEphemeral(
      res,
      `Please provide a valid 'resolve by' date. I recognise dates like 22 Sept, tomorrow, and ${year}/12/5` +
        youSaid,
    )
  }
  const resolveBy = dateResult[0].start.date()

  if (isNaN(prediction)) {
    return sendDiscordEphemeral(
      res,
      "Please provide a valid prediction (0-100%). Don't include the % sign! " +
        youSaid,
    )
  }

  const question = await prisma.question.create({
    data: {
      title,
      resolveBy,
      userId: user.id,
      forecasts: {
        create: {
          userId: user.id,
          forecast: prediction / 100,
        },
      },
      sharedPublicly: true, // so that other people in discord can see it
      unlisted: true,
    },
    include: {
      forecasts: true,
      user: true,
    },
  })

  await backendAnalyticsEvent("question_created", {
    platform: "discord",
    user: user.id,
  })

  await backendAnalyticsEvent("forecast_submitted", {
    platform: "discord",
    user: user.id,
    question: question.id,
    forecast: prediction,
  })

  postQuestionMessage(res, question, req.body.member.user.username, prediction)

  return question
}

function postQuestionMessage(
  res: VercelResponse,
  question: QuestionWithUserAndForecasts,
  authorDiscordName: string | undefined,
  authorForecastPercent: number,
) {
  const questionUrl = getQuestionUrl(question, false)
  res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Add your own prediction`,
              url: questionUrl,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: "rich",
          title: truncateString(question.title, 255),
          description: truncateString(
            (`${authorDiscordName}` || question.user.name) +
              ` predicted ${authorForecastPercent}%`,
            4095,
          ),
          color: 0x4f46e5,
          timestamp: question.resolveBy.toISOString(),
          footer: {
            text: `Resolves by`,
          },
          url: questionUrl,
        },
      ],
    },
  })
}

async function getFatebookUser(req: VercelRequest) {
  return await prisma.user.findUnique({
    where: {
      discordUserId: req.body.member.user.id,
    },
  })
}

function showApiInputModal(res: VercelResponse) {
  return res.send({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: "login_modal",
      title: "Connect your Fatebook.io account",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "api_key",
              label: "Your fatebook.io API key",
              style: 1,
              min_length: 1,
              max_length: 100,
              placeholder: "Go to fatebook.io/api-setup to get your API key",
              required: true,
              value: "Go to fatebook.io/api-setup to get your API key",
            },
          ],
        },
      ],
    },
  })
}

async function handleLoginModalSubmit(req: VercelRequest, res: VercelResponse) {
  const apiKey = req.body?.data?.components?.[0]?.components?.[0]?.value
  if (!apiKey) {
    return sendDiscordEphemeral(res, "You must provide an API key")
  }

  const users = await prisma.user.updateMany({
    where: {
      apiKey,
    },
    data: {
      discordUserId: req.body.member.user.id,
    },
  })

  if (users.count === 0) {
    return sendDiscordEphemeral(res, "No user found with that API key")
  }

  if (users.count > 1) {
    throw new Error("Multiple users found with that API key")
  }

  return sendDiscordEphemeral(
    res,
    `Your Fatebook account is connected! Now you can use /forecast to make a prediction`,
  )
}
