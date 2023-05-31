import { intlFormatDistance } from "date-fns"
import { getDateYYYYMMDD } from "../lib/_utils_common"

export function FormattedDate({
  date
} : {
  date: Date
}) {
  const oneWeekMs = 1000 * 60 * 60 * 24 * 7
  return (
    <span title={date.toString()} className="cursor-help">
      {(date.getTime() <= Date.now() || date.getTime() - Date.now() < oneWeekMs) ?
        intlFormatDistance(date, new Date())
        :
        getDateYYYYMMDD(date)
      }
    </span>
  )
}