import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const foobar = async (req: VercelRequest, res: VercelResponse) => {
  await prisma.user.create({
    data: {
      name: 'Alice'
    },
  })
  res.status(200).json({ message: 'ok' });
};

export default foobar;
