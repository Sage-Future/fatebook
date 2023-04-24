import { Forecast, Profile, Question, QuestionSlackMessage, User, SlackMessage, PingSlackMessage, Group } from "@prisma/client"

export type QuestionSlackMessageWithMessage = QuestionSlackMessage & {
    message: SlackMessage
}

export type PingSlackMessageWithMessage = PingSlackMessage & {
    message: SlackMessage
}

export type QuestionWithForecastsAndUsersAndAuthorAndSlackMessages = QuestionWithForecastsAndUsersAndAuthor & {
    questionMessages: QuestionSlackMessageWithMessage[]
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
    questionMessages: QuestionSlackMessageWithMessage[]
}

export type QuestionWithAuthorAndSlackMessages = QuestionWithAuthor & {
    questionMessages: QuestionSlackMessageWithMessage[]
}


export type QuestionWithAuthorAndSlackMessagesAndGroups = QuestionWithAuthorAndSlackMessages & {
    groups: Group[]
}

export type QuestionWithAuthorAndSlackMessagesAndResolvePingMessages = QuestionWithAuthorAndSlackMessages & {
    pingResolveMessages: PingSlackMessageWithMessage[]
}

export type ForecastWithQuestionWithSlackMessagesAndForecasts = Forecast & {
    question: QuestionWithSlackMessagesAndForecasts
}

export type ProfileWithUser = Profile & {
    user: User
}

