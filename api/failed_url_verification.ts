import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const payload = JSON.parse(req.body.payload)
  console.log("In failed_url_verification.ts")
  res.json({ challenge: payload.challenge })
}
