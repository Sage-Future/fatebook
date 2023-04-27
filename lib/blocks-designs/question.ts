import { Question, Resolution, Group, Forecast } from '@prisma/client'
import { ActionsBlock, InputBlock, SectionBlock } from '@slack/types'
import { conciseDateTime, getResolutionEmoji, displayForecast } from '../_utils'
import {  QuestionWithForecastWithProfileAndUserWithProfilesWithGroups, ForecastWithProfileAndUserWithProfilesWithGroups, ProfileWithGroups, UserWithProfilesWithGroups } from '../../prisma/additional'
import { noForecastsMessage, feedbackFormUrl, maxLatestForecastsVisible, maxForecastsPerUser, defaultDisplayPictureUrl } from '../_constants'
import { Blocks, markdownBlock, ResolveQuestionActionParts, textBlock, toActionId, maybeQuestionResolutionBlock, questionForecastInformationBlock } from './_block_utils'

export function buildQuestionBlocks(teamId : string, question: QuestionWithForecastWithProfileAndUserWithProfilesWithGroups): Blocks {


  return [
    {
      'type': 'section',
      'text': markdownBlock(`*${question.title}*`),
      'accessory': {
        'type': 'overflow',
        'action_id': toActionId({
          action: 'questionOverflow',
          questionId: question.id,
        }),
        'options': [
          ...(question.resolution ?
            [
              {
                'text': textBlock('Undo resolve'),
                'value': 'undo_resolve',
              }
            ]
            :
            (['yes', 'no', 'ambiguous'] as ResolveQuestionActionParts['answer'][]).map(
              (answer) => ({
                'text': textBlock(`${getResolutionEmoji(answer?.toUpperCase() as Resolution)} Resolve ${answer}`),
                'value': `resolve_${answer}`
              })
            )
          ),
          {
            'text': textBlock('Edit question'),
            'value': 'edit_question',
          },
          {
            'text': textBlock('Give feedback on this bot'),
            'value': 'give_feedback',
            'url': feedbackFormUrl
          },
        ]
      }
    },
    ...maybeQuestionResolutionBlock(question),
    questionForecastInformationBlock(question),
    ...(question.notes ? [{
      'type': 'section',
      'text': textBlock(`${question.notes}`)
    } as SectionBlock] : []),
    ...makeForecastListing(teamId, question.id, question.forecasts),
    ...(question.forecasts.length === 0 ? [{
      'type': 'context',
      'elements': [
        markdownBlock(noForecastsMessage)
      ]
    }] : []),
    ...(!question.resolution ? [buildPredictOptions(question)] : []),
    {
      'type': 'context',
      'elements': [
        markdownBlock(`_Created by <@${question.profile.slackId}> using /forecast_`)
      ]
    }
  ]
}

function getUserNameOrProfileLink(teamId : string, user : UserWithProfilesWithGroups) : string {
  const thisTeamsProfile = user.profiles.find((p : ProfileWithGroups) => p.groups.find((g : Group) => g.slackTeamId === teamId))
  return thisTeamsProfile ? `<@${thisTeamsProfile.slackId}>` : (user.name || 'Anon User')
}

function listUserForecastUpdates(forecasts : Forecast[]) : string {
  // if there's only one forecast, just return that
  // if there's less than max the first forecast value, an arrow, then the rest
  if (forecasts.length > maxForecastsPerUser) {
    return `~${displayForecast(forecasts[0])}~ → …` +
      `→ ~${displayForecast(forecasts[forecasts.length - 2])}~ ` + //assumes >= 3 max
      `→ *${displayForecast(forecasts[forecasts.length - 1])}*`
  } else if (forecasts.length === 1) {
    return `*${displayForecast(forecasts[0])}*`
  } else {
    return `${forecasts.slice(0,-1).map(f => `~${displayForecast(f)}~`).join(' → ')}` +
    ` → *${displayForecast(forecasts[forecasts.length - 1])}*`
  }
}


function makeForecastListing(teamId : string, questionId : number, forecasts : ForecastWithProfileAndUserWithProfilesWithGroups[]) {
  // a good adjustment would be to get each user
  //   then iterate over all the forecasts and cluster them for that user

  // get all the unique users ids from the forecasts
  const uniqueUserIds = Array.from(new Set(forecasts.map(f => f.profile.user.id)))
  const uniqueUsers   = uniqueUserIds.map(id => forecasts.find(f => f.profile.user.id === id)!.profile.user)

  // for each user, get all their forecasts sorted by date
  const forecastsByUser = [...uniqueUsers].map((user : UserWithProfilesWithGroups) => [user, forecasts.filter(f => f.profile.user.id === user.id)
    .sort((b, a) => b.createdAt.getTime() - a.createdAt.getTime())] as [UserWithProfilesWithGroups, Forecast[]])

  // sort the users by most recent forecast
  const sortedUsersAndForecasts = forecastsByUser.sort((a, b) => b[1].slice(-1)[0].createdAt.getTime() - a[1].slice(-1)[0].createdAt.getTime())

  const overMax        = sortedUsersAndForecasts.length > maxLatestForecastsVisible
  const forecastHeader = '*Latest forecasts*'

  return [
    {
      'type': 'section',
      'text': markdownBlock(forecastHeader),
      'accessory': {
        'type': 'button',
        'text': textBlock('View all'),
        'action_id': toActionId({
          action: 'viewForecastLog',
          questionId: questionId,
        }),
        'value': 'view_all_forecasts',
      }
    },
    ...sortedUsersAndForecasts.slice(0, overMax ? maxLatestForecastsVisible : sortedUsersAndForecasts.length).map(([user, forecasts]) => ({
      'type': 'context',
      'elements': [
        {
          'type': 'image',
          'image_url': user.imageUrl || defaultDisplayPictureUrl,
          'alt_text': 'profile picture'
        },
        markdownBlock(
          `${getUserNameOrProfileLink(teamId, user)} ` +
          `${listUserForecastUpdates(forecasts)} ` +
          `- _submitted at ${conciseDateTime(forecasts[forecasts.length - 1].createdAt)}_`
        )
      ]
    }))
  ]
}

function buildPredictOptions(question: Question): InputBlock | ActionsBlock {

  const useFreeTextInput = true

  const quickPredictOptions = [10, 30, 50, 70, 90]

  if (useFreeTextInput) {
    return {
      'dispatch_action': true,
      'type': 'input',
      'element': {
        'type': 'plain_text_input',
        'placeholder': textBlock('e.g. \'70%\''),
        'action_id': toActionId({
          action: 'submitTextForecast',
          questionId: question.id,
        })
      },
      'label': textBlock('Make a prediction'),
    }
  } else {
    return {
      'type': 'actions',
      'elements': [
        ...quickPredictOptions.map((option) => ({
          'type': 'button',
          'text': textBlock(`${option}%`),
          'style': 'primary',
          'value': 'click_me_123'
        })),
        {
          'type': 'button',
          'text': textBlock('....'),
          'value': 'click_me_123'
        }
      ]
    }
  }

}
