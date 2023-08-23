import { VercelRequest, VercelResponse } from '@vercel/node'
import { clientId } from '../../../lib/_constants'
import { getClientBaseUrl } from '../../../lib/web/trpc'

export default function handler(req: VercelRequest, res: VercelResponse){
  const redirectUrlBase = (process.env.NODE_ENV === "production") ? "https://fatebook.io" : getClientBaseUrl(false)
  const redirectUrl = redirectUrlBase + "/api/auth/install_approved"

  console.log("redirecting to slack for install approval. ", {
    clientId,
    redirectUrl,
  })
  res.redirect(303, `https://slack.com/oauth/v2/authorize?scope=${
    [
      'chat:write',
      'chat:write.public',
      'commands',
      'users:read',
      'users:read.email',
      'channels:read',
      'groups:read',
      'im:read',
      'im:history',
      'mpim:read',
      'app_mentions:read',
    ].join(',')
  }&client_id=${
    clientId
  }&redirect_uri=${
    redirectUrl
  }`)
}