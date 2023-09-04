import { User } from "@prisma/client"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"

export function Username({
  user,
  className,
} : {
  user: User,
  className?: string,
}) {
  return (
    <Link href={`/user/${user.id}`} onClick={(e) => e.stopPropagation()} className="no-underline hover:underline">
      <span
        className={clsx(
          className,
        )}>
        <Image
          src={user?.image || '/default_avatar.png'}
          width={20}
          height={20}
          className="inline m-0 mr-2 rounded-full select-none aspect-square"
          alt=""
        />
        <span>{user?.name || "Unknown user"}</span>
      </span>
    </Link>
  )
}