import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  console.log("In failed_slack_verification.ts")
  res.status(401).json({ success: false, message: "slack validation failed" })
}
