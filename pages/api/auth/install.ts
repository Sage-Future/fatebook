import type { NextApiRequest, NextApiResponse } from "next"
import { baseUrl, clientId } from "../../../lib/_constants"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const redirectUrl = baseUrl + "/api/auth/install_approved"

  console.log("redirecting to slack for install approval. ", {
    clientId,
    redirectUrl,
  })
  res.redirect(
    303,
    `https://slack.com/oauth/v2/authorize?scope=${[
      "chat:write",
      "chat:write.public",
      "commands",
      "users:read",
      "users:read.email",
      "channels:read",
      "groups:read",
      "im:read",
      "im:history",
      "mpim:read",
      "app_mentions:read",
    ].join(",")}&client_id=${clientId}&redirect_uri=${redirectUrl}`,
  )
}
