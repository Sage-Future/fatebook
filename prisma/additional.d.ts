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

export type QuestionWithForecastsAndUsersAndAuthorAndSlackMessagesAndFullProfiles = Question & {
    forecasts: ForecastWithProfileAndUserWithProfilesWithGroups[]
    questionMessages: QuestionSlackMessageWithMessage[]
    profile: ProfileWithUser
}

export type QuestionWithUserAndForecastsAndUsersAndAuthorAndSlackMessages = Question & {
    forecasts: ForecastWithProfileAndUserWithProfilesWithGroups[]
    questionMessages: QuestionSlackMessageWithMessage[]
    user: User
}

export type QuestionWithResolutionMessages = Question & {
  resolutionMessages: ResolutionSlackMessageWithMessage[]
}

export type QuestionWithForecastWithUserWithProfilesWithGroups = Question & {
  forecasts: ForecastWithUserWithProfilesWithGroups[]
  user: UserWithProfilesWithGroups
}

export type QuestionWithForecastWithUserWithProfilesWithGroupsAndSlackMessages = QuestionWithForecastWithUserWithProfilesWithGroups & {
  questionMessages: QuestionSlackMessageWithMessage[]
}


export type QuestionWithForecasts = Question & {
    forecasts: Forecast[]
}

export type QuestionWithScores = Question & {
    questionScores: QuestionScore[]
}

export type QuestionWithUser = Question & {
    user: UserWithProfilesWithGroups
}

export type ForecastWithUserWithProfiles = Forecast & {
    user: UserWithProfilesWithGroups
}

export type ForecastWithProfileAndUserWithProfilesWithGroups = Forecast & {
    profile: ProfileWithUserWithProfilesWithGroups
}

export type QuestionWithSlackMessagesAndForecasts = QuestionWithForecasts & {
    questionMessages: QuestionSlackMessageWithMessage[]
}

export type QuestionWithAuthorAndQuestionMessages = QuestionWithUser & {
    questionMessages: QuestionSlackMessageWithMessage[]
}

export type ForecastWithUserWithProfilesWithGroups = Forecast & {
    user: UserWithProfilesWithGroups
}

export type QuestionWithAuthorAndQuestionMessagesAndGroups = QuestionWithUser & {
    questionMessages: QuestionSlackMessageWithMessage[]
    groups: Group[]
}

export type QuestionWithGroupsAndForecastWithUserWithProfilesWithGroups = QuestionWithForecastWithUserWithProfilesWithGroups & {
    groups: Group[]
}

export type QuestionWithQuestionMessagesAndGroupsAndForecastWithUserWithProfilesWithGroups = QuestionWithGroupsAndForecastWithUserWithProfilesWithGroups & {
  questionMessages: QuestionSlackMessageWithMessage[]
}


export type QuestionWithAuthorAndAllMessages = QuestionWithUser & {
    questionMessages   : QuestionSlackMessageWithMessage[]
    pingResolveMessages: PingSlackMessageWithMessage[]
    resolutionMessages : ResolutionSlackMessageWithMessage[]
}

export type ForecastWithQuestionWithSlackMessagesAndForecasts = Forecast & {
    question: QuestionWithSlackMessagesAndForecasts
}

export type ForecastWithQuestionWithQMessagesAndRMessagesAndForecasts = Forecast & {
    question: QuestionWithQMessagesAndRMessagesAndForecasts
}

export type QuestionWithQMessagesAndRMessagesAndForecasts = QuestionWithForecasts & {
    questionMessages: QuestionSlackMessageWithMessage[]
    resolutionMessages: ResolutionSlackMessageWithMessage[]
}


export type ProfileWithUser = Profile & {
    user: User
}

export type UserWithProfiles = User & {
    profiles: Profile[]
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
