import { Forecast, Profile, Question, User } from "@prisma/client";

export type QuestionWithForecastsAndUsers = Question & {
    forecasts: ForecastWithProfileAndUser[]
}

export type QuestionWithAuthor = Question & {
    profile: ProfileWithUser
}

export type ForecastWithProfileAndUser = Forecast & {
    profile: ProfileWithUser
}

export type ProfileWithUser = Profile & {
    user: User
}

