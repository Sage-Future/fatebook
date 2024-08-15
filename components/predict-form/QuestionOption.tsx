import { Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/20/solid"
import { QuestionType } from "@prisma/client"
import clsx from "clsx"
import { useFormContext } from "react-hook-form"
import { OptionTextInput } from "./OptionTextInput"
import { PredictFormType } from "./Predict"
import { PredictionPercentageInput } from "./PredictionPercentageInput"

export function QuestionOption({
  small,
  optionId,
  index,
  questionType,
  onRemove,
  canRemove,
  onSubmit,
}: {
  small?: boolean
  optionId: number
  index: number
  questionType: QuestionType
  onRemove: () => void
  canRemove: boolean
  onSubmit: (data: any) => void
}) {
  const { unregister, clearErrors, trigger } = useFormContext<PredictFormType>()
  const handleRemove = () => {
    // Unregister the removed fields
    unregister(`options.${index}.text`)
    unregister(`options.${index}.forecast`)

    // Clear errors for the removed option
    clearErrors("options")
    void trigger("options")

    // Call the original onRemove function
    onRemove()
  }

  return (
    <div className="flex flex-row justify-between items-center gap-1.5">
      <OptionTextInput {...{ optionId, index, small, onSubmit }} />
      <span className="grow">
        <PredictionPercentageInput
          {...{ small, optionId, index, questionType, onSubmit }}
        />
      </span>
      <Transition
        show={canRemove}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <button
          onClick={handleRemove}
          className={clsx(
            "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200 rounded-full",
            index === 0 && "mt-7",
          )}
          type="button"
        >
          <XMarkIcon className="h-8 w-8 p-0.5" />
        </button>
      </Transition>
    </div>
  )
}
