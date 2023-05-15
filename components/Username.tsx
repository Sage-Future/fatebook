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
    <span className={clsx(
      "flex flex-row gap-1 items-center",
      className,
    )}>
      <Image src={user?.image || '/default_avatar.png'} width={20} height={20} className="m-0 rounded-full" alt="" />
      <span>{user?.name || "Unknown user"}</span>
    </span>
  )
}