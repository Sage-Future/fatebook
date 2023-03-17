import { VercelRequest } from '@vercel/node';
import crypto from 'crypto'

export function validate_slack_request(event : VercelRequest, signing_secret : string) {
  // Note this method is succeptible to replay attack - should check timestamp to current time
  const request_body = JSON.stringify(event['body'])

  const headers = event.headers

  const timestamp = headers['x-slack-request-timestamp']
  const slack_signature = headers['x-slack-signature']
  const base_string = 'v0:' + timestamp + ':' + request_body

  const hmac = crypto
    .createHmac('sha256', signing_secret)
    .update(base_string)
    .digest('hex')
  const computed_slack_signature = 'v0=' + hmac
  const isValid = computed_slack_signature === slack_signature

  return isValid
}
