import { intlFormatDistance } from "date-fns"
import { HTMLAttributes, ReactNode } from "react"
import { getDateYYYYMMDD } from "../lib/_utils_common"

export function FormattedDate({
  date,
  prefix,
  postfix,
  className,
} : {
  date: Date
  prefix?: ReactNode | string
  postfix?: ReactNode | string
  className?: HTMLAttributes<HTMLSpanElement>["className"]
}) {
  const oneWeekMs = 1000 * 60 * 60 * 24 * 7
  return (
    <span className={`md:tooltip ${className}`} data-tip={`${getDateYYYYMMDD(date)} at ${date.toLocaleTimeString()}`}>
      {prefix}
      {((date.getTime() <= Date.now() && ((Date.now() - date.getTime()) <= oneWeekMs * 8)) || (date.getTime() > Date.now() && date.getTime() - Date.now() < oneWeekMs)) ?
        intlFormatDistance(date, new Date())
        :
        getDateYYYYMMDD(date)
      }
      {postfix}
    </span>
  )
}