import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const foobar = async (req: VercelRequest, res: VercelResponse) => {
  const allUsers = await prisma.user.findMany({
    include: {
      forecasts: true,
      questions: true,
    },
  })

  res.json(allUsers);
};

export default foobar;
