import { ModalView } from '@slack/types'
import { slackAppId } from '../_constants'
import { markdownBlock, textBlock } from './_block_utils'

function displayCommand(input:string){
  return {
    'type': 'context',
    'elements': [
      markdownBlock(`Your prompt: \`/forecast ${input}\``),
    ]
  }
}

export function buildWrongConversationModalView(teamId: string, channelId: string, input: string) : ModalView {
  return {
    'type': 'modal',
    'title': textBlock('Fatebook can\'t post here'),
    'blocks': [
      {
        'type': 'section',
        'text': markdownBlock(`Due to permissions on Slack, Fatebook must be invited into a group before it can create a question. Try mentioning or inviting <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|@Fatebook> in a channel!`)
      },
      {
        'type': 'context',
        'elements': [
          markdownBlock(`Note that Fatebook cannot be added to direct messages to other users. Or for forecasts just for you, try <slack://app?team=${teamId}&id=${slackAppId}&tab=messages|messaging Fatebook directly>.`),
        ]
      },
      displayCommand(input)
    ]
  }
}