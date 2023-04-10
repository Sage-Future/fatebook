import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

const redirectUrl   : string = "/api/success_response"
 
export const config = {
  matcher: '/incoming/slash_forecast',
}
 
 
export default async function middleware(req: NextRequest, context: NextFetchEvent) {
  const path = req.url
  const asyncFetchPath = path!.replace('/incoming', '/api')

  context.waitUntil(
    fetch(asyncFetchPath, {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(await req.formData())),
    })
  )

  // redirect to success response
  return NextResponse.redirect(new URL(redirectUrl, req.url))
}
