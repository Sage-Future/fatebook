import {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form"
import { KeyboardEvent, useRef } from "react"
import clsx from "clsx"
import { InfoButton } from "../ui/InfoButton"
import { PredictFormType } from "../Predict"
import { QuestionType } from "@prisma/client"

// TODO: refactor these interfaces so they have core shared fields (like errors) and then extend them
interface PredictionPercentageInputProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  errors: FieldErrors<any>
  register: UseFormRegister<PredictFormType>
  watch: (name: string) => any
  handleSubmit: UseFormHandleSubmit<TFormValues>
  onSubmit: (data: any) => void
  optionId: number
  questionType: QuestionType
  // setPredictionInputRef: (
  //   optionId: string,
  //   node: HTMLInputElement | null,
  // ) => void
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function PredictionPercentageInput({
  small,
  errors,
  register,
  watch,
  handleSubmit,
  onSubmit,
  optionId,
  questionType,
  // setPredictionInputRef,
}: PredictionPercentageInputProps) {
  const predictionInputRefMine = useRef<HTMLInputElement | null>(null)

  // console.log(register)

  // const setRef = useCallback(
  //   (node: HTMLInputElement | null) => {
  //     predictionInputRefMine.current = node
  //     setPredictionInputRef(optionId, node)
  //   },
  //   [optionId, setPredictionInputRef],
  // )

  const predictionPercentage =
    questionType === QuestionType.MULTIPLE_CHOICE
      ? watch(`options.${optionId}.forecast`)
      : watch("predictionPercentage")

  const predictionPercentageRegister =
    questionType === QuestionType.MULTIPLE_CHOICE
      ? register(`options.${optionId}.forecast`, {
          required: true,
          valueAsNumber: true,
        })
      : register(`predictionPercentage`, {
          required: true,
          valueAsNumber: true,
        })

  const onEnterSubmit = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleSubmit(onSubmit)()
      e.preventDefault()
      return true
    }
  }

  // const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newValue = e.target.value
  //   console.log(newValue) // Log the new value
  // }

  return (
    <div className="min-w-fit">
      <label className={clsx("flex", small && "text-sm")} htmlFor="resolveBy">
        Make a prediction
        <InfoButton
          className="ml-1 tooltip-left"
          tooltip="How likely do you think the answer is to be YES?"
        />
      </label>
      <div
        className={clsx(
          "text-md bg-white border-2 border-neutral-300 rounded-md p-2 flex focus-within:border-indigo-700 relative",
          small ? "text-sm" : "text-md",
          errors.predictionPercentage && "border-red-500",
        )}
      >
        <div
          className={clsx(
            "h-full bg-indigo-700 absolute -m-2 rounded-l pointer-events-none opacity-20 bg-gradient-to-br from-indigo-400 to-indigo-600 transition-all",
            predictionPercentage >= 100 && "rounded-r",
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
          // ref={setRef}
          // onChange={handlePercentageChange}
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