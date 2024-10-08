import { QuestionType } from "@prisma/client"

export const signingSecret: string = process.env.SLACK_SIGNING_SECRET!
export const clientId: string = process.env.SLACK_CLIENT_ID!
export const clientSecret: string = process.env.SLACK_CLIENT_SECRET!
export const baseUrl: string = process.env.SLACKBOT_BASE_URL!
export const slackAppId: string = process.env.SLACKBOT_APP_ID!
export const postmarkApiToken: string = process.env.POSTMARK_API_TOKEN!

export const targetCronTime: number = 1 // 0 1 * * *

// Question Block
export const maxLatestForecastsVisible: number = 5
// this should be >=3, see listUserForecastUpdates
export const maxForecastsPerUser: number = 3
export const noForecastsMessage: string = `_No forecasts yet_`
export const maxDecimalPlacesForQuestionForecast: number = 1

// Resolution Message
export const maxDecimalPlacesForResolution: number = 6

// Home Tab View
export const maxForecastsVisible: number = 5
export const numberOfDaysInRecentPeriod: number = 91
export const forecastListColumnSpacing: number = 14
export const forecastPrepad: number = 4
export const scorePrepad: number = 3
export const maxAvgScoreDecimalPlaces: number = 6
export const scoreSignificantDigits: number = 2
export const maxScoreDecimalPlacesListing: number = 5
export const maxDecimalPlacesScoreForecastListing: number = 5
export const maxDecimalPlacesForecastLogListing: number = 1

// Forecast listing in home and reminders
export const maxDecimalPlacesForecastForecastListing: number = 1
export const yesResolutionColumnSpacing: number = forecastListColumnSpacing
export const noResolutionColumnSpacing: number = forecastListColumnSpacing
export const ambiguousResolutionColumnSpacing: number =
  forecastListColumnSpacing - 1

export const feedbackFormUrl = "https://forms.gle/nHkwvMFCjtNBHAT69"
export const quantifiedIntuitionsUrl = "https://quantifiedintuitions.org/"
export const questionWritingTipsUrl =
  "https://docs.google.com/document/d/1yQnNLrLCLr9dQs01vsNwIPV5-cp1PUFMcLvPuSt4KNg"
export const fatebookUrl = "https://fatebook.io/" // TODO: over time change usages to this constant
export const defaultDisplayPictureUrl = fatebookUrl + "default_avatar.png"

// Special workspaces
// Omit from analytics
export const TEST_WORKSPACES = [
  "T03051N3XQR", // Sage
  "T04U374T602", // ForecastBot
  "T052V4YQDPS", // forecast-test-2
  "T0532NY1SV8", // Adam ForecastBot
  "T0554AC87T6", // fatebook-staging
]
// Show extra `install` note in questions in these workspaces
export const CONNECTOR_WORKSPACES = [
  "T0532NY1SV8", // Adam ForecastBot
  "TEQ28RPAN", // EA Forecasting + Epistemics
  // "T0296L8C8F9", // Lightcone Offices
  "T01JANAE7FZ", // EA UK
  "TCPAQPU94", // Boston EA Organisers
  "T0LE0CFD2", // EA Groups
  "T054STGLAD9", // EAG London
  "T03FPP2328Y", // LEAH office
] as string[]

export const slackUnsupportedQuestionTypes: QuestionType[] = [
  QuestionType.MULTIPLE_CHOICE,
]
