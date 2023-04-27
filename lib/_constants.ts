import * as dotenv from 'dotenv'
dotenv.config()

export const signingSecret : string = process.env.SLACK_SIGNING_SECRET!
export const clientId      : string = process.env.SLACK_CLIENT_ID!
export const clientSecret  : string = process.env.SLACK_CLIENT_SECRET!
export const baseUrl       : string = process.env.SLACKBOT_BASE_URL!
export const slackAppId    : string = process.env.SLACKBOT_APP_ID!

export const maxDecimalPlaces    : number = 1

// Home Tab View
export const maxForecastsVisible        : number = 5
export const numberOfDaysInRecentPeriod : number = 91
export const forecastListColumnSpacing  : number = 14

export const feedbackFormUrl = 'https://forms.gle/nHkwvMFCjtNBHAT69'
export const quantifiedIntuitionsUrl = 'https://quantifiedintuitions.org/'