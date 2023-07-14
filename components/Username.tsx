import { User } from "@prisma/client"
import clsx from "clsx"
import Image from "next/image"

export function Username({
  user,
  className,
} : {
  user: User,
  className?: string,
}) {
  return (
    <span
      className={clsx(
        className,
      )}>
      <Image
        src={user?.image || '/default_avatar.png'}
        width={20}
        height={20}
        className="inline m-0 mr-2 rounded-full select-none"
        alt=""
      />
      <span>{user?.name || "Unknown user"}</span>
    </span>
  )
}