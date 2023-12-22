import { Comment, Forecast, PingSlackMessage, Profile, Question, QuestionScore, QuestionSlackMessage, ResolutionSlackMessage, SlackMessage, Tag, Tournament, User, UserList } from "@prisma/client"

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
    forecasts: ForecastWithProfileAndUser[]
    questionMessages: QuestionSlackMessageWithMessage[]
    profile: ProfileWithUser
}

export type QuestionWithUserAndForecastsWithUser = Question & {
    forecasts: (Forecast & {user: User})[]
    user: User
}

export type QuestionWithUserAndForecastsAndUsersAndAuthorAndSlackMessages = Question & {
    forecasts: ForecastWithProfileAndUser[]
    questionMessages: QuestionSlackMessageWithMessage[]
    user: User
}

export type QuestionWithResolutionMessages = Question & {
  resolutionMessages: ResolutionSlackMessageWithMessage[]
}

export type QuestionWithUserAndSharedWith = QuestionWithUser & {
    sharedWith: User[]
}

export type QuestionWithForecastsAndSharedWith = QuestionWithForecasts & {
    sharedWith: User[]
}

export type QuestionWithForecastsAndSharedWithAndLists = QuestionWithForecastsAndSharedWith & {
    sharedWithLists: UserListWithAuthorAndUsers[]
}

export type QuestionWithForecastWithUserWithProfiles = Question & {
  forecasts: ForecastWithUserWithProfiles[]
  user: UserWithProfiles
}

export type QuestionWithForecastWithUserWithProfilesAndSlackMessages = QuestionWithForecastWithUserWithProfiles & {
  questionMessages: QuestionSlackMessageWithMessage[]
}


export type QuestionWithForecasts = Question & {
    forecasts: Forecast[]
}

export type QuestionWithUserAndForecasts = QuestionWithForecasts & {
    user: User
}

export type QuestionWithScores = Question & {
    questionScores: QuestionScore[]
}

export type QuestionWithForecastsAndScores = QuestionWithForecasts & {
    questionScores: QuestionScore[]
}

export type QuestionWithUser = Question & {
    user: UserWithProfiles
}

export type ForecastWithUserWithProfiles = Forecast & {
    user: UserWithProfiles
}

export type ForecastWithProfileAndUser = Forecast & {
    profile: ProfileWithUser
}

export type QuestionWithSlackMessagesAndForecasts = QuestionWithForecasts & {
    questionMessages: QuestionSlackMessageWithMessage[]
}

export type QuestionWithAuthorAndQuestionMessages = QuestionWithUser & {
    questionMessages: QuestionSlackMessageWithMessage[]
}

export type QuestionWithQuestionMessagesAndForecastWithUserWithProfiles = QuestionWithForecastWithUserWithProfiles & {
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

export type QuestionWithStandardIncludes = QuestionWithUserAndForecastsWithUser & {
    sharedWith: User[]
    sharedWithLists: UserListWithAuthorAndUsers[]
    questionMessages: QuestionSlackMessageWithMessage[]
    comments: CommentWithUser[]
    tags: Tag[]
}

export type CommentWithUser = Comment & {
    user: User
}

export type ProfileWithUser = Profile & {
    user: User
}

export type UserWithProfiles = User & {
    profiles: Profile[]
}

export type QuestionWithUserLists = Question & {
    sharedWithLists: UserList[]
}

export type UserListWithAuthorAndUsers = UserList & {
    author: User
    users: User[]
}

export type QuestionWithTournamentsAndLists = Question & {
    tournaments: Tournament[]
    sharedWithLists: UserList[]
}