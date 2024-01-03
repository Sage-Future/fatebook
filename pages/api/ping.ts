import { VercelRequest, VercelResponse } from "@vercel/node"

export default function handler(req: VercelRequest, res: VercelResponse): void {
  console.log(`ping ${new Date()}`)
  res.status(200).send(`ping ${new Date()}`)
}
