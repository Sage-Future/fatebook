import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_utils.js'

const createAlice = async (req: VercelRequest, res: VercelResponse) => {
  await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'foobar@foob.com'
    },
  })
  res.status(200).json({ message: 'ok' });
};

export default createAlice;
