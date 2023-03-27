import { Forecast, Profile, Question } from "@prisma/client";

export type QuestionWithForecastsAndAuthor = Question & {
    forecasts: ForecastWithProfile[]
}

export type ForecastWithProfile = Forecast & {
    profile: Profile
}