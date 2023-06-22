import { intlFormatDistance } from "date-fns"
import { getDateYYYYMMDD } from "../lib/_utils_common"
import { HTMLAttributes, ReactNode } from "react"

export function FormattedDate({
  date,
  prefix,
  postfix,
  className,
  alwaysUseDistance = false,
  capitalise = false,
  currentDateShowToday = false,
} : {
  date: Date | undefined
  prefix?: ReactNode | string
  postfix?: ReactNode | string
  className?: HTMLAttributes<HTMLSpanElement>["className"]
  alwaysUseDistance?: boolean
  capitalise?: boolean
  currentDateShowToday?: boolean
}) {
  const oneWeekMs = 1000 * 60 * 60 * 24 * 7

  if (!date) {
    return <></>
  }

  const formattedDate = (alwaysUseDistance || (date.getTime() <= Date.now() || date.getTime() - Date.now() < oneWeekMs)) ?
    (
      currentDateShowToday && getDateYYYYMMDD(date) === getDateYYYYMMDD(new Date()) ?
        "today"
        :
        intlFormatDistance(date, new Date()))
    :
    getDateYYYYMMDD(date)

  return (
    <span className={`md:tooltip ${className}`} data-tip={date.toString()}>
      {prefix}
      {capitalise ?
        formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
        :
        formattedDate
      }
      {postfix}
    </span>
  )
}