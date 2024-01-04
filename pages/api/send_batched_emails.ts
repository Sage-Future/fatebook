import { NextApiRequest, NextApiResponse } from "next"
import { sendBatchedEmails } from "../../lib/web/notifications"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.query.key !== process.env.CHECK_UPDATES_KEY) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  await sendBatchedEmails()
  res.status(200).json({ status: "Batched emails sent" })
}
