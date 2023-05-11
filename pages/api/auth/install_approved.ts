import { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'
import { clientId, clientSecret } from '../../../lib/_constants'
import prisma, { postSlackMessage } from '../../../lib/_utils'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // user has approved the app being installed to their workspace, this is the redirect URI
  // now we need to exchange the temporary code for a permanent token

  const tempCode = req.query.code
  if (!tempCode) {
    console.error("Missing code in req.query: ", req.query)
    return
  }

  const response = await fetch(
    `https://slack.com/api/oauth.v2.access?client_id=${clientId}&client_secret=${clientSecret}&code=${tempCode}`,
    {
      method: 'post',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  let data = await response.json() as {ok: boolean, access_token: string, team: { id: string, name: string }, scope: string, authed_user: { id: string }, bot_user_id?: string}
  console.log({data})
  if (data.ok === false) {
    console.error('Error getting permanent token:', data, ' for temp code: ', tempCode, ' and client id: ', clientId)
    throw new Error('Error getting permanent token')
  }

  if (!data.access_token || !data.team || !data.team.id || !data.team.name) {
    console.error('Missing data from response:', data)
    throw new Error('Missing data from response')
  }

  // store the token in db
  await prisma.workspace.upsert({
    where: {
      teamId: data.team.id,
    },
    create: {
      teamId: data.team.id,
      teamName: data.team.name,
      token: data.access_token,
    },
    update: {
      token: data.access_token,
      teamName: data.team.name,
    },
  })

  const user = data?.authed_user?.id
  if (user) {
    const fatebookMention = data.bot_user_id ? `<@${data.bot_user_id}>` : "@Fatebook"
    await postSlackMessage(data.team.id, {
      channel: user,
      text: `You've added Fatebook to ${data.team.name}!\n
*Here’s a message you can copy and paste to introduce it to your team:*\n\n
${fatebookMention} is now added to this workspace! It lets us track our predictions, right here in Slack.\n
You can create a forecasting question like “Will we release the podcast by Tuesday?” by typing \`/forecast\` . Then, everyone in the channel can add their predictions. When Tuesday comes around, you can resolve the question as Yes, No or Ambiguous.\n
We’ll each get a score for how accurate our predictions are. Build a track record to see how you’re improving over time!\n
If you want to make private forecasts, that only you can see, you can type \`/forecast\` in a DM with ${fatebookMention}.\n
Some ideas of questions we can forecast on:\n
  :trophy: Project outcomes: \`"/forecast Will we double our users by March?"\`\n
  :chart_with_upwards_trend: Project progress: \`"/forecast Will we move office this year?"\`\n
  :earth_africa: Project-relevant events: \`"/forecast Will GPT-5 be released before 2025?"\`\n`,
      mrkdwn: true,
    }, user)
    console.log("DMed user who installed")
  } else {
    console.error("Missing user id, did not DM on install. In response: ", data)
  }

  console.log("Successfully installed app to workspace: ", data.team.name)
  res.redirect(`/for-slack?installedTo=${encodeURIComponent(data.team.name)}`)
}