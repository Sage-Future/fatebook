import { VercelRequest, VercelResponse } from "@vercel/node"
import { slackAppId } from "../../lib/_constants"
import {
  channelVisible,
  postEphemeralTextMessage,
} from "../../lib/_utils_server"
import { showCreateQuestionModal } from "../../lib/interactive_handlers/edit_question_modal"
import { postFromWeb } from "../../lib/interactive_handlers/postFromWeb"
import { showWrongChannelModalView } from "../../lib/interactive_handlers/show_error_modal"

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
  } else if (reqbody.text === "help") {
    await postEphemeralTextMessage(
      reqbody?.team_id,
      reqbody?.channel_id,
      reqbody?.user_id,
      `Hello and welcome to Fatebook!\n\nTo use it, simply write \`/forecast\` a binary question you'd like to get other's input on.\nFor example \`/forecast Will we double our users by March?\`\n\nSee more tips in <slack://app?team=${reqbody?.teamId}&id=${slackAppId}&tab=home|Fatebook app home>.`,
    )
  } else if (
    reqbody.text &&
    reqbody.text.trim().split(" ").length === 1 &&
    reqbody.text.trim().includes("fatebook.io")
  ) {
    const relativePath = (reqbody.text as string)
      .trim()
      .replace("https://", "")
      .replace("http://", "")
      .replace("fatebook.io", "")
      .replace("www.", "")
    await postFromWeb(
      relativePath,
      reqbody?.team_id,
      reqbody?.channel_id,
      reqbody?.user_id,
    )
  } else {
    await showCreateQuestionModal(
      reqbody?.team_id,
      reqbody?.trigger_id,
      reqbody.channel_id,
      reqbody.text,
    )
  }

  res.status(200).send(null)
}
