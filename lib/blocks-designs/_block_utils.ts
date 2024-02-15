import { Question, QuestionScore, Resolution, TargetType } from "@prisma/client"
import {
  ActionsBlock,
  Block,
  DividerBlock,
  InputBlock,
  KnownBlock,
  MrkdwnElement,
  PlainTextElement,
  SectionBlock,
} from "@slack/types"
import {
  ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts,
  QuestionWithAuthorAndQuestionMessages,
  QuestionWithForecastWithUserWithProfiles,
  QuestionWithForecasts,
  QuestionWithResolutionMessages,
  QuestionWithSlackMessagesAndForecasts,
} from "../../prisma/additional"
import {
  ambiguousResolutionColumnSpacing,
  feedbackFormUrl,
  forecastListColumnSpacing,
  forecastPrepad,
  noResolutionColumnSpacing,
  questionWritingTipsUrl,
  slackAppId,
  yesResolutionColumnSpacing,
} from "../_constants"
import {
  forecastsAreHidden,
  formatDecimalNicely,
  getCommunityForecast,
  getResolutionEmoji,
  padAndFormatScore,
  round,
} from "../_utils_common"
import {
  getDateSlackFormat,
  getSlackPermalinkFromChannelAndTS,
  getUserNameOrProfileLink,
} from "../_utils_server"
import { getQuestionUrl } from "../web/question_url"
import { checkboxes } from "./question_modal"

export interface ResolveQuestionActionParts {
  action: "resolve"
  questionId: string
  answer?: "yes" | "no" | "ambiguous" // can be omitted if answer is in value of dropdown
}

export interface SubmitTextForecastActionParts {
  action: "submitTextForecast"
  questionId: string
  reminderBlockForecastIds: number[]
}

export interface QuestionModalActionParts {
  action: "qModal"
  isCreating: boolean
  channel: string
  questionId?: string // only required for editing
}

export interface UpdateResolutionDateActionParts {
  action: "updateResolutionDate"
}

export interface UpdateHideForecastsDateActionParts {
  action: "updateHideForecastsDate"
}

export interface OverflowAccessoryPart {
  action: "submitTextForecast"
  questionId: string
}

export interface ViewForecastLogBtnActionParts {
  action: "viewForecastLog"
  questionId: string
}

export interface SortForecastsActionParts {
  action: "sortForecasts"
  field: "date" | "title" | "difference from community"
  order: "asc" | "desc"
}

export interface EditQuestionBtnActionParts {
  action: "editQuestionBtn"
  questionId: string
}

export interface UndoResolveActionParts {
  action: "undoResolve"
  questionId: string
}

export interface QuestionOverflowActionParts {
  action: "questionOverflow"
  questionId: string
}

export interface OptionsCheckBoxActionParts {
  action: "optionsCheckBox"
  questionId?: string // included when editing question
  questionResolutionDate: Date
  isCreating: boolean
}

export interface DeleteQuestionActionParts {
  action: "deleteQuestion"
  questionId: string
}

export interface SetTargetActionParts {
  action: "targetSet"
  targetType: TargetType
  targetValue: number
  homeApp: boolean
}

export interface AdjustTargetActionParts {
  action: "targetAdjust"
  cancel: boolean
}

export interface TargetTriggerActionParts {
  action: "forecastMore"
}

export interface HomeAppPageNavigationActionParts {
  action: "homeAppPageNavigation"
  direction: "next" | "previous"
  activePage: number
  closedPage: number
  isForActiveForecasts: boolean
}

export type CheckboxOption = {
  label: string
  valueLabel: string
}

export interface CancelStaleReminderActionParts {
  action: "cancelStaleReminder"
}

export type ActionIdParts =
  | ResolveQuestionActionParts
  | SubmitTextForecastActionParts
  | SortForecastsActionParts
  | QuestionModalActionParts
  | UpdateResolutionDateActionParts
  | EditQuestionBtnActionParts
  | UndoResolveActionParts
  | QuestionOverflowActionParts
  | DeleteQuestionActionParts
  | HomeAppPageNavigationActionParts
  | ViewForecastLogBtnActionParts
  | OptionsCheckBoxActionParts
  | UpdateHideForecastsDateActionParts
  | SetTargetActionParts
  | TargetTriggerActionParts
  | AdjustTargetActionParts
  | CancelStaleReminderActionParts

export type Blocks = (
  | KnownBlock
  | Block
  | Promise<KnownBlock>
  | Promise<Block>
)[]

export function toActionId(parts: ActionIdParts) {
  const stringified = JSON.stringify(parts)
  if (stringified.length >= 255) {
    throw new Error(
      `ActionIdParts too long - Slack limits actionId to 255 chars. ${stringified}`,
    )
  }
  return stringified
}

export function unpackBlockActionId(actionId: string) {
  try {
    let parts = JSON.parse(actionId) as any
    if (typeof parts.questionId === "number") {
      parts.questionId = parts.questionId.toString()
      console.log("converted parts.questionId to string")
    }
    return parts as ActionIdParts
  } catch (e) {
    throw new Error("Could not parse actionId: " + actionId)
  }
}

export function textBlock(content: string, emoji = true) {
  if (content.includes("<!date")) {
    console.warn(
      "WARNING: plain_text block uses <!date...> which will not render properly. Use mrkdwn instead.",
    )
  }

  return {
    type: "plain_text" as "plain_text",
    emoji: emoji,
    text: content,
  }
}

export function dividerBlock() {
  return {
    type: "divider" as "divider",
  } as DividerBlock
}

export function markdownBlock(content: string) {
  return {
    type: "mrkdwn" as "mrkdwn",
    text: content,
  } as MrkdwnElement
}

export function headerBlock(content: string) {
  return {
    type: "header" as "header",
    text: textBlock(content),
  } as Block
}

export function feedbackOverflow() {
  return {
    type: "overflow",
    options: [
      {
        text: {
          type: "plain_text",
          emoji: true,
          text: "Give feedback on this bot",
        },
        value: "value-0",
        url: feedbackFormUrl,
      },
    ],
  }
}

export async function getQuestionTitleLink(
  question:
    | QuestionWithAuthorAndQuestionMessages
    | QuestionWithSlackMessagesAndForecasts,
) {
  const cleanTitle = question.title.replace("<", "&lt;").replace(">", "&gt;")
  const webLink = `*<${getQuestionUrl(question, false)}|${cleanTitle}>*`

  if (!question.questionMessages || question.questionMessages.length === 0) {
    return webLink
  }

  const slackMessage = question.questionMessages[0]!
  const slackPermalink = await getSlackPermalinkFromChannelAndTS(
    slackMessage.message.teamId,
    slackMessage.message.channel,
    slackMessage.message.ts,
  )
  return `*<${slackPermalink || webLink}|${cleanTitle}>*`
}

export function maybeQuestionResolutionBlock(
  teamId: string,
  question: QuestionWithForecastWithUserWithProfiles,
): SectionBlock[] {
  return question.resolution
    ? [
        {
          type: "section",
          // NB: this assumes that the author resolved the question
          text: markdownBlock(
            `${getResolutionEmoji(question.resolution)} Resolved *${
              question.resolution
            }* by ${getUserNameOrProfileLink(teamId, question.user)}` +
              (question.resolvedAt
                ? `, ${getDateSlackFormat(
                    question.resolvedAt,
                    false,
                    "date_short_pretty",
                  )}`
                : ""),
          ),
        } as SectionBlock,
      ]
    : []
}

export function questionForecastInformationBlock(
  question: QuestionWithForecasts,
  hideForecasts: boolean,
) {
  const numUniqueForecasters = new Set(question.forecasts.map((f) => f.userId))
    .size
  return {
    type: "context",
    elements: [
      ...(question.resolution
        ? []
        : [
            markdownBlock(
              `Resolves *${getDateSlackFormat(
                question.resolveBy,
                false,
                "date_short_pretty",
              )}*`,
            ),
          ]),
      ...(numUniqueForecasters > 0
        ? [
            markdownBlock(
              `*${
                hideForecasts
                  ? "? "
                  : round(getCommunityForecast(question, new Date()) * 100, 1)
              }%* average`,
            ),
          ]
        : []),
      markdownBlock(
        `*${question.forecasts.length}* forecast${
          question.forecasts.length === 1 ? "" : "s"
        }`,
      ),
      markdownBlock(
        `*${numUniqueForecasters}* forecaster${
          numUniqueForecasters === 1 ? "" : "s"
        }`,
      ),
    ],
  }
}

export type OptionSelection = {
  text: PlainTextElement
  value: string
}

export function parseSelectedCheckboxOptions(
  optionSelections: OptionSelection[],
) {
  return checkboxes.map((cb) => {
    const option = optionSelections.find((os) => os.value === cb.valueLabel)
    return {
      ...cb,
      value: option ? true : false,
    }
  })
}

export function tipsContextBlock() {
  const tips = [
    "You can create private forecasts by DMing @Fatebook - just type /forecast",
    "You can create private forecasts by DMing @Fatebook - just type /forecast", // include twice to show up more often
    "See all existing forecasting questions by searching for `from:@Fatebook` in Slack",
    "You can use `*bold*`, `_italics_` or `~strikethrough~` in your question's notes",
    `Looking for inspiration? Check out some <${questionWritingTipsUrl}|tips for writing Fatebook questions>.`,
  ]
  return {
    type: "context",
    elements: [
      markdownBlock(`*Tip:* ${tips[Math.floor(Math.random() * tips.length)]}`),
    ],
  }
}

export function historyAndFeedbackFooter(teamId: string) {
  return {
    type: "context",
    elements: [
      markdownBlock(
        `<slack://app?team=${teamId}&id=${slackAppId}&tab=home|See your full forecasting history.>`,
      ),
      markdownBlock(
        `_Thanks for using <https://fatebook.io/for-slack|Fatebook for Slack>! We'd love to <${feedbackFormUrl}/|hear your feedback>_`,
      ),
    ],
  }
}

export function targetSetButtons(homeApp: boolean) {
  return [
    {
      type: "section",
      text: markdownBlock("Want to set a forecast target for next week?"),
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: textBlock("Write one question"),
          action_id: toActionId({
            action: "targetSet",
            targetType: TargetType.QUESTION,
            targetValue: 1,
            homeApp,
          }),
          value: "one_question",
        },
        {
          type: "button",
          text: textBlock("Write three questions"),
          action_id: toActionId({
            action: "targetSet",
            targetType: TargetType.QUESTION,
            targetValue: 3,
            homeApp,
          }),
          value: "three_question",
        },
        {
          type: "button",
          text: textBlock("Make one forecast"),
          action_id: toActionId({
            action: "targetSet",
            targetType: TargetType.FORECAST,
            targetValue: 1,
            homeApp,
          }),
          value: "one_forecast",
        },
      ],
    },
  ]
}

export async function buildForecastQuestionText(
  forecast: ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts,
  questionScore: QuestionScore | undefined,
  maxDecimalPlaces: number,
) {
  const questionTitle = await getQuestionTitleLink(forecast.question)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const yourForecastValueStr = formatDecimalNicely(
    100 * forecast.forecast.toNumber(),
    maxDecimalPlaces,
  )
  const yourForecastValuePadded = "You:" + padForecast(yourForecastValueStr)

  // get the length of the string to represent forecast.forecast as two digit decimal
  const commForecastValueStr = forecastsAreHidden(
    forecast.question,
    forecast.userId,
  )
    ? "?"
    : formatDecimalNicely(
        100 * getCommunityForecast(forecast.question, new Date()),
        maxDecimalPlaces,
      )
  const commForecastValuePadded =
    "Community:" + padForecast(commForecastValueStr)

  // resolution date
  const resolutionStr = forecast.question.resolution
    ? `Resolved: ${getResolutionEmoji(
        forecast.question.resolution,
      )} ${shortResolution(forecast.question.resolution)}`
    : `Resolves:${getDateSlackFormat(
        forecast.question.resolveBy,
        false,
        "date_short_pretty",
      )}`

  const resolutionPadded = questionScore
    ? resolutionStr + padResolution(forecast.question.resolution)
    : resolutionStr

  let scoreStr
  if (questionScore) {
    const scoreLink =
      forecast.profileId &&
      (await getScoreLink(forecast.question, forecast.profileId))

    const scoreStrLabel =
      questionScore.relativeScore !== null ? `Relative score:` : `Brier score:`
    const scoreStrLabelPad =
      questionScore.relativeScore !== null ? `` : `      `
    const scoreStrLinklabel = scoreLink
      ? `<${scoreLink}|${scoreStrLabel}>${scoreStrLabelPad}`
      : scoreStrLabel + scoreStrLabelPad

    scoreStr =
      scoreStrLinklabel +
      padAndFormatScore(questionScore.absoluteScore.toNumber())
  } else {
    scoreStr = ""
  }

  return (
    questionTitle +
    "\n" +
    yourForecastValuePadded +
    commForecastValuePadded +
    resolutionPadded +
    scoreStr
  )
}

async function getScoreLink(
  question: QuestionWithResolutionMessages,
  profileId: number,
) {
  const resolutionMessage = question.resolutionMessages
    .filter((rm) => rm.profileId == profileId)
    .sort((b, a) => a.id - b.id)[0]?.message
  if (resolutionMessage) {
    return await getSlackPermalinkFromChannelAndTS(
      resolutionMessage.teamId,
      resolutionMessage.channel,
      resolutionMessage.ts,
    )
  } else {
    return undefined
  }
}

function shortResolution(resolution: Resolution | null) {
  switch (resolution) {
    case "YES":
    case "NO":
      return resolution
    case "AMBIGUOUS":
      return "N/A"
    case null:
    default:
      return ""
  }
}

function padResolution(resolution: Resolution | null) {
  switch (resolution) {
    case "YES":
      return " ".repeat(yesResolutionColumnSpacing)
    case "NO":
      return " ".repeat(noResolutionColumnSpacing)
    case "AMBIGUOUS":
      return " ".repeat(ambiguousResolutionColumnSpacing)
    case null:
      return " ".repeat(forecastListColumnSpacing)
    default:
      return " ".repeat(forecastListColumnSpacing)
  }
}

// function used to align decimal places, even when no decimal places are present
function padForecast(
  forecast: string,
  maxprepad: number = forecastPrepad,
  maxpostpad: number = forecastListColumnSpacing,
): string {
  let prepad = maxprepad
  let postpad = maxpostpad

  if (forecast.includes(".")) postpad = postpad - 4

  const integerPart = forecast.split(".")[0]
  if (integerPart.length == 2) {
    prepad = prepad - 2
  } else if (integerPart.length == 3) {
    prepad = prepad - 4
  }

  const forecastPadded =
    " ".repeat(prepad) + "`" + forecast + "%`" + " ".repeat(postpad)
  return forecastPadded
}

export function buildPredictOptions(
  question: Question,
  reminderBlockForecastIds: number[] = [],
): InputBlock | ActionsBlock {
  const useFreeTextInput = true

  const quickPredictOptions = [10, 30, 50, 70, 90]

  if (useFreeTextInput) {
    return {
      dispatch_action: true,
      type: "input",
      element: {
        type: "plain_text_input",
        placeholder: textBlock("XX%"),
        action_id: toActionId({
          action: "submitTextForecast",
          questionId: question.id,
          reminderBlockForecastIds,
        }),
      },
      label: textBlock("Make a prediction"),
    }
  } else {
    return {
      type: "actions",
      elements: [
        ...quickPredictOptions.map((option) => ({
          type: "button",
          text: textBlock(`${option}%`),
          style: "primary",
          value: "click_me_123",
        })),
        {
          type: "button",
          text: textBlock("...."),
          value: "click_me_123",
        },
      ],
    }
  }
}
