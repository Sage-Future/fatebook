import { VercelRequest, VercelResponse } from '@vercel/node'
import prisma from '../_utils.js'

const deleteUser = async (req: VercelRequest, res: VercelResponse) => {
  if (!req.query.email) {
    res.status(400).json({ message: 'email is required' })
    return
  }

  await prisma.user.delete({
    where: {
      email: req.query.email as string,
    }
  })
  res.status(200).json({ message: 'ok' })
}

export default deleteUser
