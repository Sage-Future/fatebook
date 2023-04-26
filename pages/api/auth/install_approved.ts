import { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'
import { clientId, clientSecret } from '../../../lib/_constants'
import prisma from '../../../lib/_utils'

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
  let data = await response.json() as {ok: boolean, access_token: string, team: { id: string, name: string }, scope: string}
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

  console.log("Successfully installed app to workspace: ", data.team.name)

  // todo - redirect to a nice webpage that says "installed to your workspace" and has usage instructions
  res.status(200).send(`Installed to your workspace ${data.team.name}!`)
}