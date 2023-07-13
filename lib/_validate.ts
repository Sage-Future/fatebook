import { NextApiRequest } from "next"

export async function validateSlackRequest(request: NextApiRequest, signingSecret?: string, rawBody?: string) {
  if (!signingSecret) {
    console.error("No signing secret provided")
    return false
  }

  console.log({
    signingSecret,
    timestamp: request.headers['x-slack-request-timestamp'],
    slackSignature: request.headers['x-slack-signature'],
  })

  const timestamp = request.headers['x-slack-request-timestamp']
  if (!timestamp || Math.abs(new Date().getTime() / 1000 - Number(timestamp)) > 60 * 5) {
    // The request timestamp is more than five minutes from local time (or is missing)
    return false
  }
  const slackSignature = request.headers['x-slack-signature']
  if (!slackSignature) {
    return false
  }

  const baseString = 'v0:' + timestamp + ':' + rawBody

  // const hmac = crypto
  //   .createHmac('sha256', signingSecret)
  //   .update(baseString)
  //   .digest('hex')

  const hmac = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingSecret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign']
  )

  const baseBuffer = new TextEncoder().encode(baseString)
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmac,
    baseBuffer
  )

  const digest = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const computedSlackSignature = 'v0=' + digest
  const isValid = computedSlackSignature === slackSignature

  console.log({
    baseString,
    hmac,
    baseBuffer,
    signature,
    digest,
    computedSlackSignature,
    isValid,
  })

  return isValid
}
