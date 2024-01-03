import { VercelRequest, VercelResponse } from "@vercel/node"
import { tomorrowDate } from "../../lib/_utils_common"
import {
  channelVisible,
  getOrCreateProfile,
  postEphemeralTextMessage,
} from "../../lib/_utils_server"
import { showWrongChannelModalView } from "../../lib/interactive_handlers/show_error_modal"
import { createForecastingQuestion } from "../../lib/slash_handlers/_create_forecast"

export default async function forecast(
  req: VercelRequest,
  res: VercelResponse,
) {
  const reqbody = typeof req.body === "string" ? JSON.parse(req.body) : req.body

  if (!(await channelVisible(reqbody?.team_id, reqbody?.channel_id))) {
    await showWrongChannelModalView(
      reqbody?.team_id,
      reqbody?.trigger_id,
      reqbody.channel_id,
      reqbody.text,
    )
  } else if (reqbody.text === "help" || !reqbody.text?.trim()) {
    await postEphemeralTextMessage(
      reqbody?.team_id,
      reqbody?.channel_id,
      reqbody?.user_id,
      "To make quickly multiple forecasts at once, put one on each line, like this:\n\n" +
        "/forecast_multiple Will we double our users by March? 30%\n" +
        "Will we double our users by April? 45%\n" +
        "Will we double our users by May? 60%",
    )
  } else {
    const profile = await getOrCreateProfile(reqbody?.team_id, reqbody?.user_id)

    const lines: string[] = reqbody.text.split("\n")

    for (const line of lines) {
      const percentageAtEndOfLine = line.trim().match(/\d+(\.\d+)?%$/)
      const forecast = percentageAtEndOfLine
        ? parseFloat(percentageAtEndOfLine[0]) / 100
        : null
      const question = line.replace(/\d+(\.\d+)?%$/, "").trim() // without the percentage at the end

      if (question.length > 0) {
        await createForecastingQuestion(reqbody?.team_id, {
          question,
          date: tomorrowDate(),
          profile,
          user: profile.user,
          channelId: reqbody.channel_id,
          slackUserId: reqbody.user_id,
          forecastNum: forecast !== null ? forecast : undefined,
        })
      }
    }
  }

  res.status(200).send(null)
}
