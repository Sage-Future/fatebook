import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!process.env.DISCORD_APP_ID) {
    res.status(500).send("Missing DISCORD_APP_ID")
    return
  }
  const installUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_APP_ID}&permissions=0&scope=bot%20applications.commands`

  res.redirect(303, installUrl)
}
