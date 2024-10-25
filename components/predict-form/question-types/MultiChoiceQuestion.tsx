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

export default function MultiChoiceQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  onSubmit,
  highlightResolveBy,
}: QuestionTypeProps) {
  const { trigger, control } = useFormContext()

  const MIN_OPTIONS = 2
  const MAX_OPTIONS = 10

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

        {fields.length < MAX_OPTIONS && (
          <div className="flex flex-row justify-between items-center gap-2">
            <div className="flex-grow">
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
            </div>
            <div className=""></div>
            <div className=""></div>
          </div>
        )}

        <FormCheckbox
          onSubmit={onSubmit}
          name="nonExclusive"
          label="Allow resolution to multiple options?"
          helpText="If selected, you can resolve multiple options to YES. Otherwise, you can only resolve a single option to YES (and an OTHER option is added by default)."
          labelClassName="text-sm"
          onChange={() => {
            void trigger("options") // needed because our superRefine rule for summing to 100% isn't automatically revalidated otherwise
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
