import { VercelRequest, VercelResponse } from '@vercel/node';

export function challenge(req : VercelRequest, res: VercelResponse) {
  console.log('req body challenge is:', req.body.challenge)

  res.status(200).send({
    challenge: req.body.challenge,
  })
}
