import { NextApiRequest, NextApiResponse } from "next"
import prisma from "../../../lib/_utils_server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]"
import { assertHasAccess } from "../../../lib/web/question_router"
import NextCors from 'nextjs-cors'

interface Request extends NextApiRequest {
  query: {questionId: string}
}

const getQuestionPublicApi = async (req: Request, res: NextApiResponse) => {
  // Run the cors middleware
  // nextjs-cors uses the cors package, so we invite you to check the documentation https://github.com/expressjs/cors
  await NextCors(req, res, {
    // Options
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    origin: req.headers.origin,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })

  if (req.method == "OPTIONS") {
    return res.status(200).json({})
  }

  const { questionId } = req.query
  if ( typeof questionId !== "string" ) {
    return res.status(400).json({
      error:
        `Invalid request. questionId must be a string. ` +
        `Got questionId: ${questionId}`,
    })
  }

  const session = await getServerSession(req, res, authOptions)

  const question = await prisma.question.findUnique({
    where: {
      id: questionId,
    },
    include: {
      user:true,
      forecasts: {
        include: {
          user: true,
        },
      },
      sharedWith: true,
      sharedWithLists: {
        include: {
          author: true,
          users: true,
        },
      },
    },
  })

  assertHasAccess({userId: session?.user.id}, question)

  const userName = question!.user.name
  const prediction = question!.forecasts[0].forecast

  res.status(200).json({
    title: question?.title,
    user: {name: userName},
    prediction,
  })
}
export default getQuestionPublicApi
