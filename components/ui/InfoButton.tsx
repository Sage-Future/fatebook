import clsx from "clsx"
import { HTMLAttributes, ReactNode, useState } from "react"
import Hoverable from "./Hoverable"
import { Popover, PopoverContent, PopoverTrigger } from "./Popover"

export function InfoButton({
  tooltip,
  className,
  showInfoButton = true,
  children,
  placement = "top",
  open,
  popoverClassName,
}: {
  tooltip: string
  size?: number
  className?: HTMLAttributes<HTMLSpanElement>["className"]
  showInfoButton?: boolean
  children?: ReactNode
  placement?: "top" | "bottom" | "left" | "right"
  open?: boolean
  popoverClassName?: HTMLAttributes<HTMLDivElement>["className"]
}) {
  const [popoverHovered, setPopoverHovered] = useState(false)

  return (
    <Popover open={popoverHovered || open || undefined} placement={placement}>
      <PopoverTrigger asChild={true}>
        <span className={clsx("inline", className)}>
          {children}
          {showInfoButton && <Hoverable />}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className={clsx(
          "Popover z-[10000] bg-neutral-800 text-neutral-200 px-2 py-1 max-w-[15rem] rounded-lg text-sm transition-opacity duration-200 shadow-sm outline-none",
          popoverClassName,
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
