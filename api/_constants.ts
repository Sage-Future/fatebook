import * as dotenv from 'dotenv'
dotenv.config()

export const token          : string = process.env.SLACK_BOT_TOKEN!
export const signing_secret : string = process.env.SLACK_SIGNING_SECRET!
