import { NextApiRequest } from 'next'
import type { NextFetchEvent } from 'next/server'
import { NextResponse } from 'next/server'
import { signingSecret } from './lib/_constants'
import { validateSlackRequest } from './lib/_validate'

import type { Readable } from 'node:stream'


const redirectUrl            : string = "/api/success_response"
const dateInvalidRedirectUrl : string = "/api/failed_validation"
const urlInvalidRedirectUrl  : string = "/api/failed_url_verification"

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
    '/incoming/events_endpoint'
  ],
  api: {
    bodyParser: false,
  }
}

async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function middleware(req: NextApiRequest, context: NextFetchEvent) {
  const rawBody = await getRawBody(req)
  const validationPassed = await validateSlackRequest(req, signingSecret, rawBody.toString())
  console.log({validationPassed})
  if (!validationPassed) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'slack validation failed' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }

  const path = req.url
  const asyncFetchPath = path!.replace('/incoming', '/api')

  const reqbodyParsed : any = JSON.parse(Buffer.from(rawBody).toString('utf8'))//Object.fromEntries(await req.formData())

  let payload :any = {}
  if (reqbodyParsed.payload){
    payload = JSON.parse(reqbodyParsed.payload)
    console.log('payload', payload)
  }

  const specialCaseHandled = checkSpecialCases(payload)
  if (!specialCaseHandled) {
    context.waitUntil(
      fetch(asyncFetchPath, {
        method: "POST",
        body: JSON.stringify(reqbodyParsed),
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
function checkSpecialCases(payload: any) {
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
