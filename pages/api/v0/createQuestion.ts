import { Tag, User } from "@prisma/client"
import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { generateErrorMessage } from "zod-error"
import { backendAnalyticsEvent } from "../../../lib/_utils_server"
import prisma from "../../../lib/prisma"
import { getQuestionUrl } from "../../../lib/web/question_url"
import { UserListWithAuthorAndUsers } from "../../../prisma/additional"
import { emailNewlySharedWithUsers } from "../../../lib/web/question_router/email_shared"

const createQuestionSchema = z.object({
  apiKey: z.string().nonempty({
    message: "apiKey must be a string (see https://fatebook.io/api-setup)",
  }),
  title: z.string().nonempty({ message: "title must be a string" }),
  resolveBy: z
    .string()
    .nonempty()
    .refine((value) => !isNaN(Date.parse(value)), {
      message: "resolveBy must be a date string (YYYY-MM-DD)",
    }),
  forecast: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((num) => num && num <= 1 && num >= 0, {
      message: "forecast must be a number between 0 and 1 (not 0% to 100%)",
    }),
  // allow one or more tags, transform into an array [tag] if only one tag is provided
  tags: z
    .string()
    .or(z.array(z.string()))
    .optional()
    .transform((val) => (typeof val === "string" ? [val] : val)),
  shareWithLists: z
    .string()
    .or(z.array(z.string()))
    .optional()
    .transform((val) => (typeof val === "string" ? [val] : val)),
  hideForecastsUntil: z
    .string()
    .optional()
    .refine((value) => !value || !isNaN(Date.parse(value)), {
      message: "hideForecastsUntil must be a date string (YYYY-MM-DD)",
    }),
  sharePublicly: z
    .string()
    .optional()
    .transform((value) => value !== "false" && value !== undefined),
  shareWithEmail: z
    .string()
    .or(z.array(z.string()))
    .optional()
    .transform((val) => (typeof val === "string" ? [val] : val)),
})

interface Request extends NextApiRequest {
  body: z.infer<typeof createQuestionSchema>
}
const createQuestionPublicApi = async (req: Request, res: NextApiResponse) => {
  const result = createQuestionSchema.safeParse(req.query || req.body)
  if (!result.success) {
    res.status(400).send(
      generateErrorMessage(result.error.issues, {
        transform: ({ errorMessage, index }) =>
          `Error #${index + 1}: ${errorMessage}`,
        delimiter: { error: "\n" },
      }),
    )
    return
  }

  const {
    apiKey,
    title,
    resolveBy,
    forecast,
    tags,
    shareWithLists,
    hideForecastsUntil,
    sharePublicly,
    shareWithEmail,
  } = result.data

  const user = await prisma.user.findFirst({
    where: {
      apiKey: apiKey,
    },
  })
  if (!user) {
    res.status(401).json({
      error: `Invalid API key. Check your API key at https://fatebook.io/api-setup`,
    })
    return
  }

  let tagEntities: Tag[] = []
  if (tags && tags.length > 0) {
    tagEntities = await prisma.tag.findMany({
      where: {
        userId: user.id,
      },
    })
  }

  let userLists: UserListWithAuthorAndUsers[] = []
  if (shareWithLists && shareWithLists.length > 0) {
    userLists = await prisma.userList.findMany({
      where: {
        OR: [{ authorId: user.id }, { users: { some: { id: user.id } } }],
        name: { in: shareWithLists },
      },
      include: {
        author: true,
        users: true,
      },
    })
    const missingLists = shareWithLists.filter(
      (list) => !userLists.some((userList) => userList.name === list),
    )
    if (missingLists.length > 0) {
      res.status(400).json({
        error: `The following teams do not exist or you are not part of them: ${missingLists.join(
          ", ",
        )}`,
      })
      return
    }
  }

  let sharedWithUsers: User[] = []
  if (shareWithEmail && shareWithEmail.length > 0) {
    sharedWithUsers = await prisma.user.findMany({
      where: {
        email: { in: shareWithEmail },
      },
    })
    const missingUsers = shareWithEmail.filter(
      (email) =>
        !sharedWithUsers.some((sharedUser) => sharedUser.email === email),
    )
    if (missingUsers.length > 0) {
      res.status(400).json({
        error: `The following users do not have an account on Fatebook: ${missingUsers.join(
          ", ",
        )}`,
      })
      return
    }
  }

  const question = await prisma.question.create({
    data: {
      title: title,
      resolveBy: new Date(resolveBy),
      userId: user.id,
      forecasts: forecast
        ? {
            create: {
              userId: user.id,
              forecast: forecast,
            },
          }
        : undefined,
      tags:
        tags && tags.length > 0
          ? {
              connectOrCreate: tags.map((tag) => ({
                where: {
                  id:
                    tagEntities.find((t) => t.name === tag)?.id ||
                    "no tag with this id exists",
                },
                create: {
                  name: tag,
                  userId: user.id,
                },
              })),
            }
          : undefined,
      sharedWithLists:
        shareWithLists && shareWithLists.length > 0
          ? {
              connect: userLists.map((list) => ({
                id: list.id,
              })),
            }
          : undefined,
      sharedWith:
        shareWithEmail && shareWithEmail.length > 0
          ? {
              connect: sharedWithUsers.map((user) => ({
                id: user.id,
              })),
            }
          : undefined,
      sharedPublicly: sharePublicly,
      hideForecastsUntil: hideForecastsUntil
        ? new Date(hideForecastsUntil)
        : undefined,
    },
    include: {
      user: {
        include: {
          profiles: true,
        },
      },
      sharedWith: true,
    },
  })

  const emailsToNotify = Array.from(
    new Set([
      ...(shareWithEmail || []),
      ...(userLists.flatMap((l) => [
        l.author.email,
        ...l.users.map((u) => u.email),
      ]) || []),
    ]),
  ).filter((email) => email !== user.email)
  if (emailsToNotify.length > 0) {
    await emailNewlySharedWithUsers(emailsToNotify, question)
  }

  await backendAnalyticsEvent("question_created", {
    platform: "web",
    user: user.id,
  })

  if (forecast) {
    await backendAnalyticsEvent("forecast_submitted", {
      platform: "web",
      user: user.id,
      question: question.id,
      forecast: forecast,
    })
  }

  res.status(200).send(getQuestionUrl(question, false))
}
export default createQuestionPublicApi
