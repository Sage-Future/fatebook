import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
