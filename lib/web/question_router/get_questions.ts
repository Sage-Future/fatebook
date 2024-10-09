import prisma from "../../prisma"
import { Context } from "../trpc_base"
import { ExtraFilters, questionIncludes } from "./types"
import { getSearchedPredictionBounds, matchesAnEmailDomain } from "../utils"
import { scrubHiddenForecastsAndSensitiveDetailsFromQuestion } from "./scrub"

export async function getQuestionsUserCreatedOrForecastedOnOrIsSharedWith(
  input: {
    cursor: number
    limit?: number | null | undefined
    extraFilters?: ExtraFilters | undefined
  },
  ctx: Context,
) {
  const limit = input.limit || 100

  const skip = input.cursor
  const userIdIfAuthed = ctx.userId || "no user id, don't match" // because of prisma undefined rules

  const user = ctx.userId
    ? await prisma.user.findUnique({ where: { id: userIdIfAuthed } })
    : null

  const searchedPredictionBounds = getSearchedPredictionBounds(
    input.extraFilters?.searchString,
  )

  const questions = await prisma.question.findMany({
    skip: skip,
    take: limit + 1,
    orderBy: input.extraFilters?.resolvingSoon
      ? {
          resolveBy: "asc",
        }
      : input.extraFilters?.filterTournamentId
        ? {
            createdAt: "asc",
          }
        : {
            createdAt: "desc",
          },
    where: {
      AND: [
        input.extraFilters?.showAllPublic
          ? {
              AND: [{ sharedPublicly: true }, { unlisted: false }],
            }
          : input.extraFilters?.theirUserId ||
              input.extraFilters?.filterTournamentId
            ? {
                // show public, not unlisted questions by the user, and questions they've shared with me
                userId: input.extraFilters.theirUserId,
                tournaments: input.extraFilters.filterTournamentId
                  ? {
                      some: {
                        id: input.extraFilters.filterTournamentId,
                      },
                    }
                  : undefined,
                OR: [
                  {
                    sharedPublicly: true,
                    unlisted: input.extraFilters?.filterTournamentId
                      ? undefined
                      : false,
                  },
                  { sharedWith: { some: { id: userIdIfAuthed } } },
                  {
                    sharedWithLists: {
                      some: {
                        OR: [
                          { authorId: userIdIfAuthed },
                          { users: { some: { id: userIdIfAuthed } } },
                          matchesAnEmailDomain(user),
                        ],
                      },
                    },
                  },
                  input.extraFilters.filterTournamentId
                    ? { userId: userIdIfAuthed }
                    : {},
                ],
              }
            : input.extraFilters?.filterUserListId
              ? {
                  OR: [
                    {
                      sharedWithLists: {
                        some: {
                          id: input.extraFilters.filterUserListId,
                          OR: [
                            { authorId: userIdIfAuthed },
                            { users: { some: { id: userIdIfAuthed } } },
                            matchesAnEmailDomain(user),
                          ],
                        },
                      },
                    },
                    // if the question is in a tournament shared with the user list, also include it
                    {
                      tournaments: {
                        some: {
                          userList: {
                            id: input.extraFilters?.filterUserListId,
                            OR: [
                              { authorId: userIdIfAuthed },
                              { users: { some: { id: userIdIfAuthed } } },
                              matchesAnEmailDomain(user),
                            ],
                          },
                        },
                      },
                    },
                  ],
                }
              : {
                  // only show questions I've created, forecasted on, or are shared with me
                  OR: [
                    { userId: ctx.userId },
                    {
                      forecasts: {
                        some: {
                          userId: ctx.userId,
                        },
                      },
                    },
                    {
                      sharedWith: {
                        some: {
                          id: ctx.userId,
                        },
                      },
                    },
                    {
                      sharedWithLists: {
                        some: {
                          OR: [
                            { authorId: userIdIfAuthed },
                            { users: { some: { id: userIdIfAuthed } } },
                            matchesAnEmailDomain(user),
                          ],
                        },
                      },
                    },
                  ],
                },
        input.extraFilters?.resolved
          ? {
              resolution: {
                not: null,
              },
            }
          : {},
        input.extraFilters?.unresolved
          ? {
              resolution: null,
            }
          : {},
        input.extraFilters?.readyToResolve
          ? {
              resolution: null,
              resolveBy: {
                lte: new Date(),
              },
            }
          : {},
        input.extraFilters?.resolvingSoon
          ? {
              resolveBy: {
                gte: new Date(),
              },
              resolution: null,
            }
          : {},
        input.extraFilters?.filterTagIds
          ? {
              tags: {
                some: {
                  id: {
                    in: input.extraFilters.filterTagIds,
                  },
                },
              },
            }
          : {},
        searchedPredictionBounds
          ? {
              forecasts: {
                some: {
                  userId: userIdIfAuthed,
                  forecast: {
                    gte: searchedPredictionBounds.lowerBound / 100,
                    lte: searchedPredictionBounds.upperBound / 100,
                  },
                },
              },
            }
          : input.extraFilters?.searchString
            ? {
                OR: [
                  {
                    title: {
                      contains: input.extraFilters.searchString,
                      mode: "insensitive",
                    },
                  },
                  {
                    comments: {
                      some: {
                        comment: {
                          contains: input.extraFilters.searchString,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                  {
                    tags: {
                      some: {
                        name: {
                          contains: input.extraFilters.searchString,
                          mode: "insensitive",
                        },
                        userId: userIdIfAuthed,
                      },
                    },
                  },
                ],
              }
            : {},
      ],
    },
    include: questionIncludes(ctx.userId),
  })

  return {
    items: questions
      .map((q) =>
        scrubHiddenForecastsAndSensitiveDetailsFromQuestion(q, ctx.userId),
      )
      // don't include the extra one - it's just to see if there's another page
      .slice(0, limit),

    nextCursor: questions.length > limit ? skip + limit : undefined,
  }
}
