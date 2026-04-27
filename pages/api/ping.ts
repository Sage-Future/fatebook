import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  console.log(`ping ${new Date()}`)
  res.status(200).send(`ping ${new Date()}`)
}
