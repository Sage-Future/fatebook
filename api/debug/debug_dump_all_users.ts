import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../_utils.js'

const dumpAllProfiles = async (req: VercelRequest, res: VercelResponse) => {
  const allProfiles = await prisma.profile.findMany({
    include: {
      forecasts: true,
      questions: true,
    },
  })

  res.json(allProfiles);
};

export default dumpAllProfiles;
