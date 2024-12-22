import { PlusIcon } from "@heroicons/react/20/solid"
import { QuestionType } from "@prisma/client"
import { useCallback } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { FormCheckbox } from "../../ui/FormCheckbox"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"
import { QuestionOption } from "../QuestionOption"
import { ResolveBy } from "../ResolveBy"
import { QuestionTypeProps } from "./question-types"
import { OptionType } from "../PredictProvider"
import { formatDecimalNicely } from "../../../lib/_utils_common"

export default function MultiChoiceQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  onSubmit,
  highlightResolveBy,
}: QuestionTypeProps) {
  const { trigger, control, watch, setValue } = useFormContext()

  const MIN_OPTIONS = 2
  const MAX_OPTIONS = 100

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  })

  const addOption = useCallback(() => {
    if (fields.length < MAX_OPTIONS) {
      append({ text: "", forecast: undefined })
    }
  }, [fields.length, append])

  const removeOption = useCallback(
    (index: number) => {
      remove(index)
    },
    [remove],
  )

  const options = watch("options") as OptionType[]
  const normalizeToHundred = useCallback(() => {
    const optionsWithForecasts = options.filter(
      ({ forecast }) => forecast !== undefined && !Number.isNaN(forecast)
    ) as Array<OptionType & { forecast: number }>

    const optionsWithoutForecasts = options.filter(
      ({ forecast }) => forecast === undefined || Number.isNaN(forecast)
    )

    const allOptionsHaveForecasts = optionsWithForecasts.length === options.length

    if (allOptionsHaveForecasts) {
      const totalPercentage = optionsWithForecasts.reduce(
        (acc, option) => acc + option.forecast,
        0,
      )
      optionsWithForecasts.forEach((option, index) => {
        const scaledValue = (option.forecast! * 100) / totalPercentage
        setValue(
          `options.${index}.forecast`,
          formatDecimalNicely(scaledValue, 0),
        )
      })
    } else if (!allOptionsHaveForecasts) {
      const totalPercentage = optionsWithForecasts.reduce(
        (sum, option) => sum + option.forecast,
        0,
      )

      if (totalPercentage > 100) return

      const remainingMass = Math.max(0, 100 - totalPercentage)
      const massPerOption = remainingMass / optionsWithoutForecasts.length
      const roundedMassPerOption = formatDecimalNicely(massPerOption, 0)
      optionsWithoutForecasts.forEach((option) => {
        const originalIndex = options.findIndex((o) => o === option)
        setValue(`options.${originalIndex}.forecast`, roundedMassPerOption)
      })
    }

    void trigger("options")
  }, [options, setValue, trigger])

  return (
    <div
      className={`flex flex-col gap-4 flex-wrap justify-between ${embedded ? "flex-col" : "flex-row"}`}
    >
      {embedded && <EmbeddedOptions onSubmit={onSubmit} />}

      <div className="flex flex-col gap-2 w-fit">
        {fields.map((field, index) => (
          <QuestionOption
            key={field.id}
            optionId={index}
            small={small}
            onSubmit={onSubmit}
            index={index}
            questionType={QuestionType.MULTIPLE_CHOICE}
            onRemove={() => removeOption(index)}
            canRemove={fields.length > MIN_OPTIONS}
          />
        ))}

        <div className="flex flex-row justify-between items-center gap-2">
          <div className="flex-grow flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                addOption()
              }}
              className="btn btn-sm text-neutral-500"
            >
              <PlusIcon className="w-5 h-5" />
              Add option
            </button>

            {
              <button
                onClick={(e) => {
                  e.preventDefault()
                  normalizeToHundred()
                }}
                className="btn btn-sm text-neutral-500"
              >
                Sum to 100%
              </button>
            }
          </div>
          <div className=""></div>
          <div className=""></div>
        </div>

        <FormCheckbox
          onSubmit={onSubmit}
          name="nonExclusive"
          label="Allow resolution to multiple options?"
          helpText="If selected, you can resolve multiple options to YES. Otherwise, you can only resolve a single option to YES (and an OTHER option is added by default)."
          labelClassName="text-sm"
          onChange={() => {
            void trigger("options")
          }}
        />
      </div>

      <div className="flex flex-col justify-end">
        <div className="flex flex-row justify-between items-center gap-2">
          <ResolveBy
            small={small}
            resolveByButtons={resolveByButtons}
            questionDefaults={questionDefaults}
            highlightResolveBy={highlightResolveBy}
          />
          <PredictButton onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  )
}
