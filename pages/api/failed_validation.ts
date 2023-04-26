import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse): void {
  console.log("In failed_validation.ts")
  res.send({
    response_action: 'errors',
    errors: {
      "resolution_date": 'The date must be in the future',
    },
  })
}
