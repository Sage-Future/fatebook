import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse): void {
  console.log("In failed_slack_verification.ts")
  res.status(401).json({ success: false, message: "slack validation failed" })
}
