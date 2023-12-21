import { VercelRequest, VercelResponse } from '@vercel/node'
import { slackAppId } from '../../lib/_constants'
import prisma, { channelVisible, postEphemeralTextMessage, postSlackMessage } from '../../lib/_utils_server'
import { buildQuestionBlocks } from '../../lib/blocks-designs/question'
import { showCreateQuestionModal } from '../../lib/interactive_handlers/edit_question_modal'
import { showWrongChannelModalView } from '../../lib/interactive_handlers/show_error_modal'
import { getQuestionIdFromUrl } from '../../lib/web/question_url'

export default async function forecast(req : VercelRequest, res : VercelResponse){
  const reqbody = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body

  if (!(await channelVisible(reqbody?.team_id, reqbody?.channel_id))) {
    await showWrongChannelModalView(reqbody?.team_id, reqbody?.trigger_id, reqbody.channel_id, reqbody.text)
  } else if (reqbody.text === "help"){
    await postEphemeralTextMessage(reqbody?.team_id,
                                   reqbody?.channel_id,
                                   reqbody?.user_id,
                                   `Hello and welcome to Fatebook!\n\nTo use it, simply write \`/forecast\` a binary question you'd like to get other's input on.\nFor example \`/forecast Will we double our users by March?\`\n\nSee more tips in <slack://app?team=${reqbody?.teamId}&id=${slackAppId}&tab=home|Fatebook app home>.`)
  } else if (reqbody.text && reqbody.text.trim().split(" ").length === 1 && reqbody.text.trim().includes("fatebook.io")){
    const relativePath = (reqbody.text as string).trim().replace("https://", "").replace("http://", "").replace("fatebook.io", "").replace("www.", "")
    await postFromWeb(relativePath, reqbody?.team_id, reqbody?.channel_id, reqbody?.user_id)
  }else{
    await showCreateQuestionModal(reqbody?.team_id, reqbody?.trigger_id, reqbody.channel_id, reqbody.text)
  }

  res.status(200).send(null)
}

async function postFromWeb(relativePath: string, teamId?: string, channelId?: string, slackUserId?: string) {
  if (!teamId || !channelId || !slackUserId) {
    return
  }

  if (relativePath.startsWith("/q/")) {
    const id = getQuestionIdFromUrl(relativePath)

    if (!id) {
      return await postEphemeralTextMessage(teamId, channelId, slackUserId, "It looks like there's a problem with the URL you pasted.")
    }

    const question = await prisma.question.findUnique({
      where: {
        id
      },
      include: {
        user: {
          include: {
            profiles: true
          }
        },
        forecasts: {
          include: {
            user: {
              include: {
                profiles: true
              }
            }
          }
        }
      }
    })

    if (!question) {
      return await postEphemeralTextMessage(teamId, channelId, slackUserId, "We couldn't find a question at that URL.")
    }

    const data = await postSlackMessage(teamId, {
      channel: channelId,
      text: `Forecasting question shared: ${question}`,
      blocks: await buildQuestionBlocks(teamId, question),
      unfurl_links: false,
      unfurl_media: false
    }, slackUserId)

    if (!data.ts) {
      throw new Error("No ts returned from Slack")
    }

    await prisma.question.update({
      where: {
        id: question.id
      },
      data: {
        questionMessages: {
          create: {
            message: {
              create: {
                ts: data.ts,
                channel: channelId,
                teamId: teamId,
              }
            }
          }
        }
      }
    })
  }
}