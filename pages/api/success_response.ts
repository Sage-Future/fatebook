import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  console.log("In success_response.ts")
  res.status(200).send(null)
}
