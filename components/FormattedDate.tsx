import { intlFormatDistance } from "date-fns"

export function FormattedDate({
  date
} : {
  date: Date
}) {
  return (
    <span title={date.toString()} className="cursor-help">
      {intlFormatDistance(date, new Date())}
    </span>
  )
}