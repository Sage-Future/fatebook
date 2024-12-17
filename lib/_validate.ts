import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest } from "next/server"

export function validateSlackRequest(
  request: NextRequest,
  signingSecret: string,
  body: string,
) {
  const headers = request.headers

  const timestamp = headers.get("x-slack-request-timestamp")
  if (
    !timestamp ||
    Math.abs(new Date().getTime() / 1000 - Number(timestamp)) > 60 * 5
  ) {
    // The request timestamp is more than five minutes from local time (or is missing)
    return false
  }
  const slackSignature = headers.get("x-slack-signature")
  if (!slackSignature) {
    return false
  }

  const baseStr = `v0:${timestamp}:${body}`
  const expectedSignature = `v0=${createHmac("sha256", signingSecret)
    .update(baseStr, "utf8")
    .digest("hex")}`

  const expectedBuffer = Buffer.from(expectedSignature, "utf8")
  const slackBuffer = Buffer.from(slackSignature, "utf8")

  if (
    expectedBuffer.length !== slackBuffer.length ||
    !timingSafeEqual(expectedBuffer, slackBuffer)
  ) {
    console.error("WEBHOOK SIGNATURE MISMATCH")
    console.log("expectedSignature", expectedSignature)
    console.log("slackSignature", slackSignature)
    console.log("baseStr", baseStr)
    console.log("timestamp", timestamp)
    console.log("body", body)
    // return false
  }
  return true
}
