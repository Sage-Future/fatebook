import clsx from "clsx"
import { KeyboardEvent, useEffect, useRef } from "react"
import { getDateYYYYMMDD, tomorrowDate } from "../../../lib/_utils_common"
import { utcDateStrToLocalDate } from "../../../lib/web/utils"
import { FormattedDate } from "../../ui/FormattedDate"
import { InfoButton } from "../../ui/InfoButton"
import { QuestionTypeProps } from "./question-types"

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
  const resolveByUTCStr = watch("resolveBy")
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

  const onDateKeydown = (e: KeyboardEvent) => {
    onEnterSubmit(e)
    if (e.key === "Tab") {
      e.preventDefault()
      if (e.shiftKey) {
        textAreaRef!.current?.focus()
      } else {
        predictionInputRefMine.current?.focus()
      }
    }
  }

  const resolveByRegister = register("resolveBy", { required: true })
  const resolveByInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (resolveByInputRef.current) {
      if (highlightResolveBy) {
        resolveByInputRef.current.classList.add(
          "shadow-[0_0_50px_-1px_rgba(0,0,0,1)]",
          "shadow-indigo-700",
          "duration-100",
        )
      } else {
        resolveByInputRef.current.classList.remove(
          "shadow-[0_0_50px_-1px_rgba(0,0,0,1)]",
          "shadow-indigo-700",
          "duration-100",
        )
      }
    }
  }, [highlightResolveBy])

  return (
    <div className="flex flex-row gap-8 flex-wrap justify-between">
      <div className="flex flex-row gap-2">
        <div className="flex flex-col">
          <label
            className={clsx("flex", small && "text-sm")}
            htmlFor="resolveBy"
          >
            Resolve by
            <InfoButton
              className="ml-1 tooltip-right"
              tooltip="When should I remind you to resolve this question?"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            <div className="flex flex-col">
              <input
                className={clsx(
                  "border-2 border-neutral-300 rounded-md p-2 resize-none focus:outline-indigo-700 transition-shadow duration-1000",
                  small ? "text-sm" : "text-md",
                  errors.resolveBy && "border-red-500",
                )}
                type="date"
                defaultValue={getDateYYYYMMDD(
                  new Date(questionDefaults?.resolveBy || tomorrowDate()),
                )}
                onKeyDown={onDateKeydown}
                onMouseDown={(e) => e.stopPropagation()}
                {...resolveByRegister}
                ref={(e) => {
                  resolveByInputRef.current = e
                  resolveByRegister.ref(e)
                }}
              />
              <span className="italic text-neutral-400 text-sm p-1">
                {!resolveByButtons && (
                  <FormattedDate
                    date={utcDateStrToLocalDate(resolveByUTCStr)}
                    alwaysUseDistance={true}
                    capitalise={true}
                    currentDateShowToday={true}
                    includeTime={false}
                  />
                )}
                {resolveByButtons && (
                  <div className="mt-2 flex flex-wrap gap-0.5 shrink justify-between">
                    {resolveByButtons.map(({ date, label }) => (
                      <button
                        key={label}
                        className={clsx(
                          "btn btn-xs grow-0",
                          getDateYYYYMMDD(date) ===
                            getDateYYYYMMDD(
                              utcDateStrToLocalDate(resolveByUTCStr),
                            ) || "btn-ghost",
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          setValue("resolveBy", getDateYYYYMMDD(date))
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </span>
            </div>
          </div>
        </div>

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

        {embedded && (
          <div className="flex items-center">
            <label
              htmlFor="sharePublicly"
              className="text-sm max-w-[8rem] ml-2"
            >
              Share with anyone with the link?
            </label>
            <input
              type="checkbox"
              id="sharePublicly"
              defaultChecked={
                typeof window !== "undefined" &&
                window.localStorage.getItem("lastSharedPubliclyState") ===
                  "true"
              }
              className="ml-2 checkbox check"
              onClick={(e) => {
                localStorage.setItem(
                  "lastSharedPubliclyState",
                  e.currentTarget.checked ? "true" : "false",
                )
              }}
              onMouseDown={(e) => e.stopPropagation()}
              {...register("sharePublicly")}
            />
          </div>
        )}
      </div>

      <div className="self-center">
        <button
          onClick={(e) => {
            e.preventDefault()
            void handleSubmit(onSubmit)(e)
          }}
          className="btn btn-primary btn-lg hover:scale-105"
          disabled={!!userId && Object.values(errors).some((err) => !!err)}
        >
          {userId || session.status === "loading"
            ? "Predict"
            : "Sign up to predict"}
        </button>
      </div>
    </div>
  )
}

export default BinaryQuestion
