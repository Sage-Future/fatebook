import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  const payload = JSON.parse(req.body.payload)
  console.log("In failed_url_verification.ts")
  res.json({ challenge: payload.challenge })
}
