import { KeyboardEvent, useRef } from "react"
import clsx from "clsx"
import { InfoButton } from "../../ui/InfoButton"
import { QuestionTypeProps } from "./question-types"
import { ResolveBy } from "../ResolveBy"
import { EmbeddedOptions } from "../EmbeddedOptions"
import { PredictButton } from "../PredictButton"

interface BinaryQuestionProps extends QuestionTypeProps {}

export function BinaryQuestion({
  small,
  resolveByButtons,
  questionDefaults,
  embedded,
  userId,
  onSubmit,
  session,
  register,
  setValue,
  errors,
  watch,
  handleSubmit,
  textAreaRef,
  highlightResolveBy,
}: BinaryQuestionProps) {
  const predictionInputRefMine = useRef<HTMLInputElement | null>(null)

  const predictionPercentage = watch("predictionPercentage")

  const predictionPercentageRegister = register("predictionPercentage", {
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

  const resolveByProps = {
    small,
    resolveByButtons,
    questionDefaults,
    onSubmit,
    register,
    setValue,
    errors,
    watch,
    handleSubmit,
    textAreaRef,
    highlightResolveBy,
    predictionInputRefMine,
  }

  const predictButtonProps = {
    userId,
    onSubmit,
    session,
    errors,
    handleSubmit,
  }

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-row gap-2">
        <ResolveBy {...resolveByProps}></ResolveBy>

        <div className="min-w-fit">
          <label
            className={clsx("flex", small && "text-sm")}
            htmlFor="resolveBy"
          >
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
                width: `${Math.min(
                  Math.max(predictionPercentage || 0, 0),
                  100,
                )}%`,
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
              ref={(e) => {
                predictionPercentageRegister.ref(e)
                predictionInputRefMine.current = e
              }}
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

        {embedded && <EmbeddedOptions register={register} />}
      </div>

      <div className="self-center">
        <PredictButton {...predictButtonProps} />
      </div>
    </div>
  )
}

export default BinaryQuestion
