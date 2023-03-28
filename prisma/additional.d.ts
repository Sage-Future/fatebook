import { Forecast, Profile, Question, User } from "@prisma/client";

export type QuestionWithForecastsAndAuthor = Question & {
    forecasts: ForecastWithProfileAndUser[]
}

export type ForecastWithProfileAndUser = Forecast & {
    profile: ProfileWithUser
}

export type ProfileWithUser = Profile & {
    user: User
}