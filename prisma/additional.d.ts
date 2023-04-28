import { Forecast, Profile, Question, QuestionSlackMessage, ResolutionSlackMessage, User, SlackMessage, PingSlackMessage, Group, QuestionScore } from "@prisma/client"

export type QuestionSlackMessageWithMessage = QuestionSlackMessage & {
    message: SlackMessage
}

export type PingSlackMessageWithMessage = PingSlackMessage & {
    message: SlackMessage
}

export type ResolutionSlackMessageWithMessage = ResolutionSlackMessage & {
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

export type QuestionWithScores = Question & {
    questionScores: QuestionScore[]
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

export type QuestionWithAuthorAndQuestionMessages = QuestionWithAuthor & {
    questionMessages: QuestionSlackMessageWithMessage[]
}


export type QuestionWithAuthorAndQuestionMessagesAndGroups = QuestionWithAuthorAndSlackMessages & {
    groups: Group[]
}

export type QuestionWithAuthorAndQuestionMessagesAndResolvePingMessages = QuestionWithAuthorAndSlackMessages & {
    pingResolveMessages: PingSlackMessageWithMessage[]
}

export type QuestionWithAuthorAndAllMessages = QuestionWithAuthor & {
    questionMessages   : QuestionSlackMessageWithMessage[]
    pingResolveMessages: PingSlackMessageWithMessage[]
    resolutionMessages : ResolutionSlackMessageWithMessage[]
}

export type ForecastWithQuestionWithSlackMessagesAndForecasts = Forecast & {
    question: QuestionWithSlackMessagesAndForecasts
}

export type ProfileWithUser = Profile & {
    user: User
}

