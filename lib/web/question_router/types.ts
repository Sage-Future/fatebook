import { z } from "zod"

export const questionIncludes = (userId: string | undefined) => ({
  forecasts: {
    include: {
      user: true,
    },
  },
  options: {
    include: {
      forecasts: {
        include: {
          user: true,
        },
      },
    },
  },
  user: true,
  sharedWith: true,
  sharedWithLists: {
    include: {
      author: true,
      users: true,
    },
  },
  questionMessages: {
    include: {
      message: true,
    },
  },
  comments: {
    include: {
      user: true,
    },
  },
  tags: {
    where: {
      user: {
        id:
          userId || "match with no users (because no user with this ID exists)",
      },
    },
  },
})

export const zodExtraFilters = z.object({
  resolved: z
    .boolean({ description: "Only get resolved questions" })
    .optional(),
  unresolved: z
    .boolean({ description: "Only get unresolved questions" })
    .optional(),
  readyToResolve: z
    .boolean({ description: "Only get questions ready to be resolved" })
    .optional(),
  resolvingSoon: z
    .boolean({ description: "Only get questions that are resolving soon" })
    .optional(),
  filterTagIds: z
    .array(
      z.string({ description: "Only get questions with any of these tags" }),
    )
    .optional(),
  showAllPublic: z
    .boolean({
      description:
        "Show all public questions from fatebook.io/public (if false, get only questions you've created, forecasted on, or are shared with you)",
    })
    .optional(),
  searchString: z
    .string({
      description: "Only get questions or tags containing this search string",
    })
    .optional(),
  theirUserId: z
    .string({
      description:
        "Show questions created by this user (instead of your questions)",
    })
    .optional(),
  filterTournamentId: z
    .string({
      description:
        "Show questions in this tournament (instead of your questions)",
    })
    .optional(),
  filterUserListId: z
    .string({
      description: "Show questions in this team (instead of your questions)",
    })
    .optional(),
})
export type ExtraFilters = z.infer<typeof zodExtraFilters>
