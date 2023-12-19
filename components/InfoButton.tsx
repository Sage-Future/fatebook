import clsx from 'clsx'
import { HTMLAttributes, ReactNode, useState } from 'react'
import Hoverable from './Hoverable'
import { Popover, PopoverContent, PopoverTrigger } from "./Popover"

export function InfoButton({
  tooltip,
  className,
  showInfoButton = true,
  children,
  placement = "top",
} : {
  tooltip: string,
  size?: number,
  className?: HTMLAttributes<HTMLSpanElement>["className"]
  showInfoButton?: boolean,
  children?: ReactNode
  placement?: "top" | "bottom" | "left" | "right"
}) {

  const [popoverHovered, setPopoverHovered] = useState(false)

  return (
    <Popover open={popoverHovered || undefined} placement={placement}>
      <PopoverTrigger asChild={true}>
        <span
          className={clsx(
            'inline',
            className,
          )}
        >
          {children}
          {showInfoButton && <Hoverable/>}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className={clsx(
          'Popover z-[10000] bg-indigo-100 p-2 max-w-[15rem] rounded-md text-sm transition-opacity duration-200 shadow-sm outline-none',
        )}
        onMouseEnter={() => setPopoverHovered(true)}
        onMouseLeave={() => setPopoverHovered(false)}
        onMouseMove={() => setPopoverHovered(true)}
      >
        {tooltip}
      </PopoverContent>
    </Popover>
  )
}