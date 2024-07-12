import clsx from "clsx"
import { InfoButton } from "../ui/InfoButton"
import { getDateYYYYMMDD, tomorrowDate } from "../../lib/_utils_common"
import { utcDateStrToLocalDate } from "../../lib/web/utils"
import { useEffect, useRef } from "react"
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form"
import { FormattedDate } from "../ui/FormattedDate"

interface ResolveByProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  small?: boolean
  resolveByButtons?: { date: Date; label: string }[]
  questionDefaults?: {
    title?: string
    tournamentId?: string
    resolveBy?: Date
    shareWithListIds?: string[]
    sharePublicly?: boolean
    unlisted?: boolean
  }
  register: UseFormRegister<any>
  setValue: UseFormSetValue<TFormValues>
  errors: FieldErrors<any>
  watch: (name: string) => any
  highlightResolveBy: boolean
}

export function ResolveBy({
  small,
  resolveByButtons,
  questionDefaults,
  register,
  setValue,
  errors,
  watch,
  highlightResolveBy,
}: ResolveByProps) {
  const resolveByUTCStr = watch("resolveBy")

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
    <div className="grid grid-cols-1-3-1">
      <label className={clsx("flex", small && "text-sm")} htmlFor="resolveBy">
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
            // IMO the default functionality is better here, but can discuss
            // onKeyDown={onDateKeydown}
            onMouseDown={(e) => e.stopPropagation()}
            ref={(e) => {
              resolveByInputRef.current = e
              register("resolveBy", { required: true }).ref(e)
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
  )
}
