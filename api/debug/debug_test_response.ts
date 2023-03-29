import { VercelRequest, VercelResponse } from '@vercel/node'

const testResponse = (req: VercelRequest, res: VercelResponse): void => {
  res.json({ test: 'success'})
}

export default testResponse
