import { Forecast, Profile, Question, QuestionSlackMessage, ResolutionSlackMessage, User, SlackMessage, PingSlackMessage, Group } from "@prisma/client"

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

export type QuestionWithForecastsAndUsersAndAuthorAndSlackMessagesAndFullProfiles = Question & {
    forecasts: ForecastWithProfileAndUserWithProfilesWithGroups[]
    questionMessages: QuestionSlackMessageWithMessage[]
    profile: ProfileWithUser
}

export type QuestionWithForecastsAndUsersAndAuthor = Question & {
    forecasts: ForecastWithProfileAndUser[]
    profile: ProfileWithUser
}

export type QuestionWithForecastWithProfileAndUserWithProfilesWithGroups = Question & {
  forecasts: ForecastWithProfileAndUserWithProfilesWithGroups[]
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

export type ForecastWithProfileAndUserWithProfilesWithGroups = Forecast & {
    profile: ProfileWithUserWithProfilesWithGroups
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

export type ProfileWithUserWithProfilesWithGroups = Profile & {
    user: UserWithProfilesWithGroups
}

export type ProfileWithGroups = Profile & {
    groups: Group[]
}

export type UserWithProfilesWithGroups = User & {
    profiles: ProfileWithGroups[]
}
