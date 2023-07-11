import { VercelRequest } from '@vercel/node'
import crypto from 'crypto'

export function validateSlackRequest(request : VercelRequest, signingSecret : string) {
  const requestBody = JSON.stringify(request['body'])

  const headers = request.headers

  const timestamp = headers['x-slack-request-timestamp']
  if(Math.abs(new Date().getTime() / 1000 - Number(timestamp)) > 60 * 5) {
    // The request timestamp is more than five minutes from local time.
    return false
  }
  const slackSignature = headers['x-slack-signature']
  const baseString = 'v0:' + timestamp + ':' + requestBody

  const hmac = crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')
  const computedSlackSignature = 'v0=' + hmac
  const isValid = computedSlackSignature === slackSignature

  return isValid
}
