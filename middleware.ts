import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const redirectUrl            : string = "/api/success_response"
const dateInvalidRedirectUrl : string = "/api/failed_validation"
const urlInvalidRedirectUrl  : string = "/api/failed_url_verification"

enum ValidationRedirect {
  InvalidDate = 1,
  InvalidURL
}

export const config = {
  matcher: [
    '/incoming/slash_forecast',
    '/incoming/interactive_endpoint',
    '/incoming/events_endpoint'
  ]
}

export default async function middleware(req: NextRequest, context: NextFetchEvent) {
  const path = req.url
  const asyncFetchPath = path.replace('/incoming', '/api')

  const reqbodyParsed : any = Object.fromEntries(await req.formData())

  let payload :any = {}
  if (reqbodyParsed.payload){
    payload = JSON.parse(reqbodyParsed.payload)
    console.log('payload', payload)
  }

  const specialCaseHandled = checkSpecialCases(payload, req)
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
function checkSpecialCases(payload: any, req: NextRequest) {
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
