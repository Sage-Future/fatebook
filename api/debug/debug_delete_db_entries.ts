import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './_utils.js'

const deleteEntries = async (req: VercelRequest, res: VercelResponse) => {
  const deleteForecasts = prisma.forecast.deleteMany()
  const deleteQuestions = prisma.question.deleteMany()
  const deleteProfiles  = prisma.profile.deleteMany()
  const deleteUsers     = prisma.user.deleteMany()
  const deleteGroups    = prisma.group.deleteMany()

  // The transaction runs synchronously so deleteUsers must run last.
  await prisma.$transaction([deleteForecasts, deleteQuestions, deleteProfiles,  deleteUsers, deleteGroups])
  res.status(200).json({ message: 'ok' });
};

export default deleteEntries;
