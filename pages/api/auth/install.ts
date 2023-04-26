import { VercelRequest, VercelResponse } from '@vercel/node'
import { baseUrl, clientId } from '../../../lib/_constants'

export default function handler(req: VercelRequest, res: VercelResponse){
  const redirectUrl = baseUrl + "/api/auth/install_approved"

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
      'team:read',
    ].join(',')
  }&client_id=${
    clientId
  }&redirect_uri=${
    redirectUrl
  }`)
}