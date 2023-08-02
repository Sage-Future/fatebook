import type { NextFetchEvent, NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { signingSecret } from './lib/_constants'
import { validateSlackRequest } from './lib/_validate'
import { verifyDiscordRequest } from './lib/discord/utils'


const redirectUrl            : string = "/api/success_response"
const dateInvalidRedirectUrl : string = "/api/failed_validation"
const urlInvalidRedirectUrl  : string = "/api/failed_url_verification"
const slackInvalidRedirectUrl : string = "/api/failed_slack_verification"

// eslint-disable-next-line @typescript-eslint/naming-convention
enum ValidationRedirect {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  InvalidDate = 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  InvalidURL
}

export const config = {
  matcher: [
    '/incoming/slash_forecast',
    '/incoming/interactive_endpoint',
    '/incoming/events_endpoint',

    '/api/discord/interactions',
  ],
  api: {
    bodyParser: false,
  }
}

function reparsePayload(bufferBody: ArrayBuffer){
  var enc = new TextDecoder("utf-8")
  const bodyParams = new URLSearchParams(enc.decode(bufferBody))
  return Object.fromEntries(bodyParams)
}

export default async function middleware(req: NextRequest, context: NextFetchEvent) {
  const bufferBody = await req.arrayBuffer()

  if (req.url.includes('api/discord/')) {
    console.log("Validating Discord request: ", bufferBody)
    const isValid = verifyDiscordRequest(req, bufferBody)
    if (!isValid) {
      console.log("Validation failed")
      return NextResponse.redirect(new URL(slackInvalidRedirectUrl, req.url)) // todo make a discord invalid redirect
    }

    console.log("Validation passed")
    return NextResponse.next()
  }

  const validationPassed = await validateSlackRequest(req, signingSecret, Buffer.from(bufferBody).toString('utf8'))
  if (!validationPassed) {
    return NextResponse.redirect(new URL(slackInvalidRedirectUrl, req.url))
  }

  const path = req.url
  const asyncFetchPath = path!.replace('/incoming', '/api')

  const body = reparsePayload(bufferBody)

  const specialCaseHandled = checkSpecialCases(body)
  if (!specialCaseHandled) {
    context.waitUntil(
      fetch(asyncFetchPath, {
        method: "POST",
        body: JSON.stringify(body),
      })
    )

    // wait for 800ms so the Slack loading spinner displays for the user
    // (because we expect our functions to take >= 800ms to run)
    await new Promise((resolve) => setTimeout(resolve, 800))

    // redirect to success response
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  } else {
    switch (specialCaseHandled) {
      case ValidationRedirect.InvalidDate:
        return NextResponse.redirect(new URL(dateInvalidRedirectUrl, req.url))
      case ValidationRedirect.InvalidURL:
        return NextResponse.redirect(new URL(urlInvalidRedirectUrl, req.url))
    }
  }
}

// Returns true iff the request was handled by this function
function checkSpecialCases(body: any) {
  if (!body.payload) {
    return null
  }
  const payload = JSON.parse(body.payload)
  if (!payload.type) {
    return null
  }

  switch (payload.type) {
    case 'view_submission':
      if (payload.view.callback_id.startsWith('question_modal') && !dateValid(payload)) {
        console.log('date is invalid, redirecting to failed validation')
        return ValidationRedirect.InvalidDate
      }
      break

    case 'url_verification':
      console.log("Handling url_verification for events API. ", payload)
      return ValidationRedirect.InvalidURL
  }

  return null
}

function dateValid(payload: any){
  const callbackActionId = payload.view.callback_id.substring('question_modal'.length)
  const actionParts      = JSON.parse(callbackActionId) as any

  const actionId         = '{"action":"updateResolutionDate"}'
  const blockObj : any   = Object.values(payload.view.state.values as any).find((v : any) => v[actionId] !== undefined)
  const resolutionDate   = blockObj[actionId]?.selected_date

  if (actionParts.isCreating &&
      resolutionDate &&
      new Date(resolutionDate) < new Date()) {
    return false
  } else {
    return true
  }
}
