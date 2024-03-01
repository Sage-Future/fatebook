import { BellIcon } from "@heroicons/react/24/outline"
import { useUserId } from "../lib/web/utils"
import { Notifications } from "./Notifications"

export default function NotificationsPopover() {
  const userId = useUserId()

  if (!userId) return <></>
  return (
    <div className="dropdown dropdown-hover dropdown-bottom dropdown-end active:bg-neutral-200 active:text-black">
      <label tabIndex={0} className="flex gap-1">
        <BellIcon width={20} className="text-neutral-600" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content z-[9999] px-2 py-4 shadow-lg bg-base-100 rounded-box overflow-y-auto max-h-[32rem] w-96"
      >
        <div className="max-w-full w-full overflow-x-clip">
          <Notifications />
        </div>
      </ul>
    </div>
  )
}
