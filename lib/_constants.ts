import * as dotenv from 'dotenv'
dotenv.config()

export const signingSecret : string = process.env.SLACK_SIGNING_SECRET!
export const clientId      : string = process.env.SLACK_CLIENT_ID!
export const clientSecret  : string = process.env.SLACK_CLIENT_SECRET!
export const baseUrl       : string = process.env.SLACKBOT_BASE_URL!
export const slackAppId    : string = process.env.SLACKBOT_APP_ID!

export const maxDecimalPlaces    : number = 1

// Question Block
export const maxLatestForecastsVisible  : number = 5
export const defaultDisplayPictureUrl ='https://camo.githubusercontent.com/eb6a385e0a1f0f787d72c0b0e0275bc4516a261b96a749f1cd1aa4cb8736daba/68747470733a2f2f612e736c61636b2d656467652e636f6d2f64663130642f696d672f617661746172732f6176615f303032322d3531322e706e67'
// this should be >=3, see listUserForecastUpdates
export const maxForecastsPerUser  : number = 3
export const noForecastsMessage   : string = `_No forecasts yet_`

// Home Tab View
export const maxForecastsVisible        : number = 5
export const numberOfDaysInRecentPeriod : number = 91
export const forecastListColumnSpacing  : number = 14

export const feedbackFormUrl = 'https://forms.gle/nHkwvMFCjtNBHAT69'
export const quantifiedIntuitionsUrl = 'https://quantifiedintuitions.org/'

// Special workspaces
// Omit from analytics
export const TEST_WORKSPACES = [
  "T03051N3XQR", // Sage
  "T04U374T602", // ForecastBot
  "T052V4YQDPS", // forecast-test-2
  "T0532NY1SV8", // Adam ForecastBot
  "T0554AC87T6", // fatebook-staging
]
// Show extra install message
export const CONNECTOR_WORKSPACES = [
] as string[]