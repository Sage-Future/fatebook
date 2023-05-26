import { Forecast, Question, Resolution } from '@prisma/client'
import { ActionsBlock, InputBlock, SectionBlock } from '@slack/types'
import { ForecastWithUserWithProfiles, QuestionWithForecastWithUserWithProfiles, UserWithProfiles } from '../../prisma/additional'
import { CONNECTOR_WORKSPACES, defaultDisplayPictureUrl, feedbackFormUrl, maxDecimalPlacesForQuestionForecast, maxForecastsPerUser, maxLatestForecastsVisible, noForecastsMessage } from '../_constants'
import { displayForecast, getDateSlackFormat, getResolutionEmoji, getUserNameOrProfileLink } from '../_utils'
import { Blocks, ResolveQuestionActionParts, markdownBlock, maybeQuestionResolutionBlock, questionForecastInformationBlock, textBlock, toActionId } from './_block_utils'

function formatForecast(forecast: Forecast, maxDecimalPlaces : number = maxDecimalPlacesForQuestionForecast): string {
  return displayForecast(forecast, maxDecimalPlaces)
}

export function buildQuestionBlocks(teamId : string, question: QuestionWithForecastWithUserWithProfiles): Blocks {
  const hideForecasts =
    (question.hideForecastsUntil && question.hideForecastsUntil?.getTime() > Date.now())
    || false

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
    ...maybeQuestionResolutionBlock(teamId, question),
    questionForecastInformationBlock(question, hideForecasts),
    ...(question.notes ? [{
      'type': 'section',
      'text': markdownBlock(`${question.notes}`)
    } as SectionBlock] : []),
    ...makeForecastListing(teamId, question.id, question.forecasts, hideForecasts, question.hideForecastsUntil),
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
        markdownBlock(`_Created by ${getUserNameOrProfileLink(teamId, question.user)} using /forecast_`),
        ...(CONNECTOR_WORKSPACES.includes(teamId) ?
          [markdownBlock(`_<https://fatebook.io/for-slack|Add Fatebook to another Slack workspace>_`)]
          : [])
      ]
    }
  ]
}

function listUserForecastUpdates(forecasts : Forecast[]) : string {
  // if there's only one forecast, just return that
  // if there's less than max the first forecast value, an arrow, then the rest
  if (forecasts.length > maxForecastsPerUser) {
    return `~${formatForecast(forecasts[0])}~ → …` +
      `→ ~${formatForecast(forecasts[forecasts.length - 2])}~ ` + //assumes >= 3 max
      `→ *${formatForecast(forecasts[forecasts.length - 1])}*`
  } else if (forecasts.length === 1) {
    return `*${formatForecast(forecasts[0])}*`
  } else {
    return `${forecasts.slice(0,-1).map(f => `~${formatForecast(f)}~`).join(' → ')}` +
    ` → *${formatForecast(forecasts[forecasts.length - 1])}*`
  }
}

function makeForecastListing(teamId : string, questionId : number,
  forecasts : ForecastWithUserWithProfiles[],
  hideForecasts : boolean, hideForecastsUntil : Date | null) {
  const forecastHeaderBlock = {
    'type': 'section',
    'text': markdownBlock(hideForecasts ?
      `_Forecasts are hidden until ${getDateSlackFormat(hideForecastsUntil!, false, 'date_short_pretty')}_`
      :
      '*Latest forecasts*'
    ),
    'accessory': {
      'type': 'button',
      'text': textBlock(hideForecasts ? 'View my forecasts' : 'View all'),
      'action_id': toActionId({
        action: 'viewForecastLog',
        questionId: questionId,
      }),
      'value': 'view_all_forecasts',
    }
  }

  if (hideForecasts){
    return [forecastHeaderBlock]
  }
  // a good adjustment would be to get each user
  //   then iterate over all the forecasts and cluster them for that user

  // get all the unique users ids from the forecasts
  const uniqueUserIds = Array.from(new Set(forecasts.map(f => f.user.id)))
  const uniqueUsers   = uniqueUserIds.map(id => forecasts.find(f => f.user.id === id)!.user)

  // for each user, get all their forecasts sorted by date
  const forecastsByUser = [...uniqueUsers].map((user) => [user, forecasts.filter(f => f.user.id === user.id)
    .sort((b, a) => b.createdAt.getTime() - a.createdAt.getTime())] as [UserWithProfiles, Forecast[]])

  // sort the users by most recent forecast
  const sortedUsersAndForecasts = forecastsByUser.sort((a, b) => b[1].slice(-1)[0].createdAt.getTime() - a[1].slice(-1)[0].createdAt.getTime())

  const overMax        = sortedUsersAndForecasts.length > maxLatestForecastsVisible

  return [
    forecastHeaderBlock,
    ...sortedUsersAndForecasts.slice(0, overMax ? maxLatestForecastsVisible : sortedUsersAndForecasts.length).map(([user, forecasts]) => ({
      'type': 'context',
      'elements': [
        {
          'type': 'image',
          'image_url': user.image || defaultDisplayPictureUrl,
          'alt_text': 'profile picture'
        },
        markdownBlock(
          `${getUserNameOrProfileLink(teamId, user)} ` +
          `${listUserForecastUpdates(forecasts)} ` +
          `- _submitted ${getDateSlackFormat(forecasts[forecasts.length - 1].createdAt, true, 'date_short_pretty')}_`
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
        'placeholder': textBlock('XX%'),
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
