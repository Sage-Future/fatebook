import { Question } from '@prisma/client'
import { ActionsBlock, ModalView } from '@slack/types'
import { getDateYYYYMMDD } from '../_utils.js'
import { textBlock, toActionId } from './_block_utils.js'

export function buildEditQuestionModalView(question: Partial<Question>, isCreating: boolean, channel: string): ModalView {
  return {
    'type': 'modal',
    'callback_id': `question_modal${toActionId({
      action: 'qModal',
      questionId: question?.id,
      isCreating,
      channel,
    })}`,
    'title': textBlock(`${isCreating ? "Create" : "Edit"} forecast question`),
    'submit': textBlock('Submit'),
    'close': textBlock('Cancel'),
    'blocks': [
      {
        'type': 'input',
        'label': textBlock('Question'),
        'element': {
          'type': 'plain_text_input',
          'action_id': 'forecast_question',
          'placeholder': textBlock('"When will humans walk on Mars?"'),
        },
      },
      {
        'block_id': 'resolution_date',
        'type': 'input',
        'label': textBlock('When should I remind you to resolve this question?'),
        'element': {
          'type': 'datepicker',
          'initial_date': getDateYYYYMMDD(
            question?.resolveBy || new Date(Date.now() + ( 3600 * 1000 * 24))  // default = tomorrow
          ),
          'placeholder': textBlock('Select a date'),
          'action_id': toActionId({
            action: 'updateResolutionDate',
          })
        },
      },
      {
        'type': 'input',
        'label': textBlock('Notes'),
        'element': {
          'type': 'plain_text_input',
          'action_id': 'notes',
          // 'placeholder': textBlock('...'),
          'multiline': true,
        },
        'optional': true,
      },
      // TODO - add options like this:
      // {
      //   'type': 'input',
      //   'element': {
      //     'type': 'checkboxes',
      //     'options': [
      //       {
      //         'text': textBlock('Delphi mode: Hide other people\'s forecasts until you forecast'),
      //         'value': 'value-0'
      //       }
      //     ],
      //     'action_id': 'checkboxes-action'
      //   },
      //   'label': textBlock('Options')
      // },
      ...(isCreating ? [] : [{ // only show delete button if editing
        'type': 'actions',
        'elements': [
          {
            'type': 'button',
            'style': 'danger',
            'text': textBlock('Permanently delete question'),
            'value': 'click_me_123',
            'action_id': 'actionId-0'
          },
        ]
      } as ActionsBlock]),
    ]
  }
}