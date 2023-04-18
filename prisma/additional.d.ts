import { Forecast, Profile, Question, QuestionSlackMessage, User } from "@prisma/client"

export type QuestionWithForecastsAndUsersAndAuthorAndSlackMessages = QuestionWithForecastsAndUsersAndAuthor & {
    slackMessages: QuestionSlackMessage[]
}

export type QuestionWithForecastsAndUsersAndAuthor = Question & {
    forecasts: ForecastWithProfileAndUser[]
    profile: ProfileWithUser
}

export type QuestionWithForecastsAndUsers = Question & {
    forecasts: ForecastWithProfileAndUser[]
}

export type QuestionWithForecasts = Question & {
    forecasts: Forecast[]
}

export type QuestionWithAuthor = Question & {
    profile: ProfileWithUser
}

export type ForecastWithProfileAndUser = Forecast & {
    profile: ProfileWithUser
}

export type QuestionWithSlackMessagesAndForecasts = QuestionWithForecasts & {
    slackMessages: QuestionSlackMessage[]
}

export type QuestionWithAuthorAndSlackMessages = QuestionWithAuthor & {
    slackMessages: QuestionSlackMessage[]
}

export type QuestionWithAuthorAndSlackMessagesAndResolvePingMessages = QuestionWithAuthorAndSlackMessages & {
    resolvePingMessages: QuestionSlackMessage[]
}

export type ForecastWithQuestionWithSlackMessagesAndForecasts = Forecast & {
    question: QuestionWithSlackMessagesAndForecasts
}

export type ProfileWithUser = Profile & {
    user: User
}

