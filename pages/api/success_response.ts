import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse): void {
  console.log("In success_response.ts")
  res.status(200).send(null)
}
