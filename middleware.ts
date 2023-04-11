import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const redirectUrl               : string = "/api/success_response"
const failedValidateRedirectUrl : string = "/api/failed_validation"
 
export const config = {
  matcher: ['/incoming/slash_forecast',
            '/incoming/interactive_endpoint']
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
 
export default async function middleware(req: NextRequest, context: NextFetchEvent) {
  const path = req.url
  const asyncFetchPath = path!.replace('/incoming', '/api')

  const reqbodyParsed : any = Object.fromEntries(await req.formData())

  let payload :any = {}
  if (reqbodyParsed.payload){
    payload = JSON.parse(reqbodyParsed.payload)
    console.log('payload', payload)
  }

  if(payload.type &&
     payload.type == 'view_submission' &&
     payload.view.callback_id.startsWith('question_modal') &&
     !dateValid(payload)){
    console.log('date is invalid, redirecting to failed validation')
    return NextResponse.redirect(new URL(failedValidateRedirectUrl, req.url))
  } else {
    context.waitUntil(
      fetch(asyncFetchPath, {
        method: "POST",
        body: JSON.stringify(reqbodyParsed),
      })
    )
    // redirect to success response
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }
}
