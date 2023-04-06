import * as dotenv from 'dotenv'
dotenv.config()

export const token         : string = process.env.SLACK_BOT_TOKEN!
export const signingSecret : string = process.env.SLACK_SIGNING_SECRET!

export const maxDecmialPlaces    : number = 1
export const maxForecastsVisible : number = 50
