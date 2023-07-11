import { InformationCircleIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"
import { HTMLAttributes, useState } from 'react'

export function InfoButton({
  tooltip,
  size = 16,
  className,
} : {
  tooltip: string,
  size?: number,
  className?: HTMLAttributes<HTMLSpanElement>["className"]
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span
      className={clsx(
        'tooltip my-auto whitespace-normal',
        isOpen && 'tooltip-open',
        className
      )}
      data-tip={tooltip}
      onClick={() => setIsOpen(!isOpen)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <InformationCircleIcon
        height={size}
        width={size} />
    </span>
  )
}