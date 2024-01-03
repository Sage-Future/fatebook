import { Forecast, Resolution } from "@prisma/client"
import { SectionBlock } from "@slack/types"
import {
  QuestionWithForecastWithUserWithProfiles,
  UserWithProfiles,
} from "../../prisma/additional"
import {
  CONNECTOR_WORKSPACES,
  defaultDisplayPictureUrl,
  feedbackFormUrl,
  maxDecimalPlacesForQuestionForecast,
  maxForecastsPerUser,
  maxLatestForecastsVisible,
  noForecastsMessage,
} from "../_constants"
import {
  displayForecast,
  forecastsAreHidden,
  getResolutionEmoji,
  padAndFormatScore,
} from "../_utils_common"
import prisma, {
  getDateSlackFormat,
  getUserNameOrProfileLink,
} from "../_utils_server"
import {
  Blocks,
  ResolveQuestionActionParts,
  buildPredictOptions,
  markdownBlock,
  maybeQuestionResolutionBlock,
  questionForecastInformationBlock,
  textBlock,
  toActionId,
} from "./_block_utils"

function formatForecast(
  forecast: Forecast,
  maxDecimalPlaces: number = maxDecimalPlacesForQuestionForecast,
): string {
  return displayForecast(forecast, maxDecimalPlaces)
}

export async function buildQuestionBlocks(
  teamId: string,
  question: QuestionWithForecastWithUserWithProfiles,
): Promise<Blocks> {
  const hideForecasts = forecastsAreHidden(question)

  return [
    {
      type: "section",
      text: markdownBlock(`*${question.title}*`),
      accessory: {
        type: "overflow",
        action_id: toActionId({
          action: "questionOverflow",
          questionId: question.id,
        }),
        options: [
          ...(question.resolution
            ? [
                {
                  text: textBlock("Undo resolve"),
                  value: "undo_resolve",
                },
              ]
            : (
                [
                  "yes",
                  "no",
                  "ambiguous",
                ] as ResolveQuestionActionParts["answer"][]
              ).map((answer) => ({
                text: textBlock(
                  `${getResolutionEmoji(
                    answer?.toUpperCase() as Resolution,
                  )} Resolve ${answer}`,
                ),
                value: `resolve_${answer}`,
              }))),
          {
            text: textBlock("Edit question"),
            value: "edit_question",
          },
          {
            text: textBlock("Give feedback on this bot"),
            value: "give_feedback",
            url: feedbackFormUrl,
          },
        ],
      },
    },
    ...maybeQuestionResolutionBlock(teamId, question),
    questionForecastInformationBlock(question, hideForecasts),
    ...(question.notes
      ? [
          {
            type: "section",
            text: markdownBlock(`${question.notes}`),
          } as SectionBlock,
        ]
      : []),
    ...(question.resolution && question.resolution !== Resolution.AMBIGUOUS
      ? await makeResolvedQuestionListing(teamId, hideForecasts, question)
      : makeForecastListing(teamId, hideForecasts, question)),
    ...(question.forecasts.length === 0
      ? [
          {
            type: "context",
            elements: [markdownBlock(noForecastsMessage)],
          },
        ]
      : []),
    ...(!question.resolution ? [buildPredictOptions(question)] : []),
    {
      type: "context",
      elements: [
        markdownBlock(
          `_Created by ${getUserNameOrProfileLink(
            teamId,
            question.user,
          )} using /forecast_`,
        ),
        ...(CONNECTOR_WORKSPACES.includes(teamId)
          ? [
              markdownBlock(
                `_<https://fatebook.io/for-slack|Add Fatebook to another Slack workspace>_`,
              ),
            ]
          : []),
      ],
    },
  ]
}

function listUserForecastUpdates(forecasts: Forecast[]): string {
  // if there's only one forecast, just return that
  // if there's less than max the first forecast value, an arrow, then the rest
  if (forecasts.length > maxForecastsPerUser) {
    return (
      `~${formatForecast(forecasts[0])}~ → …` +
      `→ ~${formatForecast(forecasts[forecasts.length - 2])}~ ` + //assumes >= 3 max
      `→ *${formatForecast(forecasts[forecasts.length - 1])}*`
    )
  } else if (forecasts.length === 1) {
    return `*${formatForecast(forecasts[0])}*`
  } else {
    return (
      `${forecasts
        .slice(0, -1)
        .map((f) => `~${formatForecast(f)}~`)
        .join(" → ")}` +
      ` → *${formatForecast(forecasts[forecasts.length - 1])}*`
    )
  }
}

function makeForecastListing(
  teamId: string,
  hideForecasts: boolean,
  question: QuestionWithForecastWithUserWithProfiles,
) {
  const forecastHeaderBlock = {
    type: "section",
    text: markdownBlock(
      hideForecasts
        ? `_Forecasts are hidden until ${getDateSlackFormat(
            question.hideForecastsUntil!,
            false,
            "date_short_pretty",
          )}_`
        : "*Latest forecasts*",
    ),
    ...viewAllForecastsAccessory(question.id, hideForecasts),
  }

  if (hideForecasts) {
    return [forecastHeaderBlock]
  }
  // a good adjustment would be to get each user
  //   then iterate over all the forecasts and cluster them for that user

  // get all the unique users ids from the forecasts
  const sortedUsersAndForecasts = getSortedUsersAndForecasts(question)

  const overMax = sortedUsersAndForecasts.length > maxLatestForecastsVisible

  return [
    forecastHeaderBlock,
    ...sortedUsersAndForecasts
      .slice(
        0,
        overMax ? maxLatestForecastsVisible : sortedUsersAndForecasts.length,
      )
      .map(([user, forecasts]) => ({
        type: "context",
        elements: [
          {
            type: "image",
            image_url: user.image || defaultDisplayPictureUrl,
            alt_text: "profile picture",
          },
          markdownBlock(
            `${getUserNameOrProfileLink(teamId, user)} ` +
              `${listUserForecastUpdates(forecasts)} ` +
              `- _submitted ${getDateSlackFormat(
                forecasts[forecasts.length - 1].createdAt,
                true,
                "date_short_pretty",
              )}_`,
          ),
        ],
      })),
  ]
}

const viewAllForecastsAccessory = (
  questionId: string,
  hideForecasts: boolean,
) => ({
  accessory: {
    type: "button",
    text: textBlock(hideForecasts ? "View my forecasts" : "View all"),
    action_id: toActionId({
      action: "viewForecastLog",
      questionId,
    }),
    value: "view_all_forecasts",
  },
})

async function makeResolvedQuestionListing(
  teamId: string,
  hideForecasts: boolean,
  question: QuestionWithForecastWithUserWithProfiles,
): Promise<Blocks> {
  const sortedUsersAndForecasts = getSortedUsersAndForecasts(question)

  const scores = await prisma.questionScore.findMany({
    where: {
      questionId: question.id,
    },
  })

  if (hideForecasts) {
    return [
      {
        type: "section",
        text: markdownBlock(
          `_Forecasts and scores are hidden until ${getDateSlackFormat(
            question.hideForecastsUntil!,
            false,
            "date_short_pretty",
          )}_`,
        ),
        ...viewAllForecastsAccessory(question.id, hideForecasts),
      },
    ]
  }

  if (question.forecasts.length > 0 && (!scores || scores.length === 0)) {
    console.error("Couldn't find scores for question ", question)
    return []
  }

  return [
    {
      type: "section",
      text: markdownBlock("*Top forecasters*"),
      ...viewAllForecastsAccessory(question.id, hideForecasts),
    },
    ...scores
      .sort((a, b) => a.rank - b.rank)
      .slice(0, maxLatestForecastsVisible)
      .map((score, index) => {
        const userAndForecasts = sortedUsersAndForecasts.find(
          ([user]) => user.id === score.userId,
        )

        if (!userAndForecasts) {
          console.error("Couldn't find user for score ", score)
          return {
            type: "context",
            elements: [
              markdownBlock(`${score.rank}.`),
              markdownBlock(`*Unknown user*`),
              markdownBlock(
                `Score: ${padAndFormatScore(score.absoluteScore.toNumber())}`,
              ),
            ],
          }
        }

        const [user, forecasts] = userAndForecasts
        return {
          type: "context",
          elements: [
            markdownBlock(`${score.rank}.`),
            {
              type: "image",
              image_url: user.image || defaultDisplayPictureUrl,
              alt_text: "profile picture",
            },
            markdownBlock(
              addSpacing(
                addSpacing(
                  `${getUserNameOrProfileLink(teamId, user)}`,
                  `${listUserForecastUpdates(forecasts)} `,
                  6,
                ),
                `*Brier score*: ${padAndFormatScore(
                  score.absoluteScore.toNumber(),
                )} ${index === 0 ? "  _(lower is better)_" : ""}`,
                6,
              ),
            ),
          ],
        }
      }),
  ]
}

function addSpacing(prevCols: string, newCol: string, spacing: number) {
  return prevCols + " ".repeat(spacing) + newCol
}

function getSortedUsersAndForecasts(
  question: QuestionWithForecastWithUserWithProfiles,
) {
  const uniqueUserIds = Array.from(
    new Set(question.forecasts.map((f) => f.user.id)),
  )
  const uniqueUsers = uniqueUserIds.map(
    (id) => question.forecasts.find((f) => f.user.id === id)!.user,
  )

  // for each user, get all their forecasts sorted by date
  const forecastsByUser = [...uniqueUsers].map(
    (user) =>
      [
        user,
        question.forecasts
          .filter((f) => f.user.id === user.id)
          .sort((b, a) => b.createdAt.getTime() - a.createdAt.getTime()),
      ] as [UserWithProfiles, Forecast[]],
  )

  // sort the users by most recent forecast
  const sortedUsersAndForecasts = forecastsByUser.sort(
    (a, b) =>
      b[1].slice(-1)[0].createdAt.getTime() -
      a[1].slice(-1)[0].createdAt.getTime(),
  )
  return sortedUsersAndForecasts
}
