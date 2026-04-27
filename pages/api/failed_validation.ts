import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  console.log("In failed_validation.ts")
  res.send({
    response_action: "errors",
    errors: {
      resolution_date: "The date must be in the future",
    },
  })
}
