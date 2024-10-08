import { QuestionType } from "@prisma/client"
import clsx from "clsx"
import { KeyboardEvent, useRef } from "react"
import { useFormContext } from "react-hook-form"
import { mergeRefs } from "react-merge-refs"
import { InfoButton } from "../ui/InfoButton"
import { PredictFormType } from "./PredictProvider"

export function PredictionPercentageInput({
  small,
  optionId,
  index,
  questionType,
  onSubmit,
}: {
  small?: boolean
  optionId?: number
  index?: number
  questionType: QuestionType
  onSubmit: (data: any) => void
}) {
  const {
    formState: { errors },
    register,
    watch,
    handleSubmit,
  } = useFormContext<PredictFormType>()

  const predictionInputRefMine = useRef<HTMLInputElement | null>(null)

  const predictionPercentage =
    questionType === QuestionType.MULTIPLE_CHOICE
      ? watch(`options.${optionId!}.forecast`)
      : watch("predictionPercentage")

  const predictionPercentageRegister =
    questionType === QuestionType.MULTIPLE_CHOICE
      ? register(`options.${optionId!}.forecast`, {
          required: true,
          valueAsNumber: true,
        })
      : register(`predictionPercentage`, {
          required: true,
          valueAsNumber: true,
        })

  const tooltip =
    questionType === QuestionType.BINARY
      ? "How likely do you think the answer is to be YES?"
      : "How likely do you think this answer is to be correct?"

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  return (
    <div className="min-w-fit">
      {(questionType == QuestionType.BINARY || index == 0) && (
        <label className={clsx("flex", small && "text-sm")}>
          Make a prediction
          <InfoButton className="ml-1 tooltip-left" tooltip={tooltip} />
        </label>
      )}
      <div
        className={clsx(
          "text-md bg-white border-2 border-neutral-300 rounded-md p-2 flex focus-within:border-indigo-700 relative min-w-40",
          small ? "text-sm" : "text-md",
          (errors.predictionPercentage ||
            (optionId !== undefined && errors.options?.[optionId]?.forecast)) &&
            "border-red-500 focus-within:border-red-500",
        )}
      >
        <div
          className={clsx(
            "h-full bg-indigo-700 absolute -m-2 rounded-l pointer-events-none opacity-20 bg-gradient-to-br from-indigo-400 to-indigo-600 transition-all",
            predictionPercentage && predictionPercentage >= 100 && "rounded-r",
          )}
          style={{
            width: `${Math.min(Math.max(predictionPercentage || 0, 0), 100)}%`,
          }}
        />
        <input
          className={clsx(
            "resize-none text-right w-7 flex-grow outline-none bg-transparent z-10 font-bold placeholder:font-normal placeholder:text-neutral-400",
            small ? "text-md p-px" : "text-xl",
          )}
          autoComplete="off"
          type="number"
          inputMode="decimal"
          pattern="[0-9[.]*"
          placeholder="XX"
          onKeyDown={onEnterSubmit}
          onMouseDown={(e) => e.stopPropagation()}
          {...predictionPercentageRegister}
          ref={mergeRefs([
            predictionInputRefMine,
            predictionPercentageRegister.ref,
          ])}
        />
        <span
          onClick={() => predictionInputRefMine.current?.focus()}
          className={clsx(
            "ml-px z-10 text-md font-bold select-none cursor-text",
            !predictionPercentage && "text-neutral-400",
          )}
        >
          %
        </span>
      </div>
    </div>
  )
}
