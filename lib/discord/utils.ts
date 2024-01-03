import { VercelResponse } from "@vercel/node"
import { verifyKey } from "discord-interactions"
import { NextRequest } from "next/server"

export function verifyDiscordRequest(req: NextRequest, buf: ArrayBuffer) {
  const signature = req.headers.get("X-Signature-Ed25519")
  const timestamp = req.headers.get("X-Signature-Timestamp")

  if (!signature || !timestamp) {
    console.warn("Missing signature or timestamp")
    return false
  }

  if (!process.env.DISCORD_PUBLIC_KEY) {
    throw new Error("Missing DISCORD_PUBLIC_KEY")
  }

  const isValidRequest = verifyKey(
    buf,
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY,
  )
  if (!isValidRequest) {
    console.log("Invalid request")
    return false
  }

  return true
}

export async function makeDiscordRequest(
  endpoint: string,
  options: { body?: any; [key: string]: any },
) {
  // append endpoint to root API URL
  const url = "https://discord.com/api/v10/" + endpoint
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body)

  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent":
        "DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)",
    },
    ...options,
  })
  // throw API errors
  if (!res.ok) {
    const data = await res.json()
    console.log(res.status)
    throw new Error(JSON.stringify(data))
  }
  console.log(res.status)

  return res
}

export async function installGlobalCommands(appId: string, commands: any) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await makeDiscordRequest(endpoint, { method: "PUT", body: commands })
  } catch (err) {
    console.error(err)
  }
}

export function sendDiscordEphemeral(res: VercelResponse, content: string) {
  return res.send({
    type: 4,
    data: {
      content,
      flags: 64,
    },
  })
}
