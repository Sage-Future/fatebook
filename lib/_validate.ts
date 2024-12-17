import { NextRequest } from "next/server"

export async function validateSlackRequest(
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

  const enc = new TextEncoder()

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  )

  try {
    const isValid = crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuffer(slackSignature.substring(3)),
      enc.encode(`v0:${timestamp}:${body}`),
    )
    return isValid
  } catch (error) {
    console.error("Error verifying HMAC", {
      slackSignature,
      timestamp,
      body,
      hexToBuffer: hexToBuffer(slackSignature.substring(3)),
    })
    return true
  }
}

function hexToBuffer(hexString: string) {
  const bytes = new Uint8Array(hexString.length / 2)
  for (let idx = 0; idx < hexString.length; idx += 2) {
    bytes[idx / 2] = parseInt(hexString.substring(idx, idx + 2), 16)
  }
  return bytes.buffer
}
