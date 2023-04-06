import * as dotenv from 'dotenv'
dotenv.config()

export const signingSecret : string = process.env.SLACK_SIGNING_SECRET!
export const clientId      : string = process.env.SLACK_CLIENT_ID!
export const clientSecret  : string = process.env.SLACK_CLIENT_SECRET!
export const baseUrl       : string = process.env.SLACKBOT_BASE_URL!

export const maxDecmialPlaces    : number = 1
export const maxForecastsVisible : number = 50
