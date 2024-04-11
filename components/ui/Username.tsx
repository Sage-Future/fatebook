import { User } from "@prisma/client"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useIsEmbedded } from "../../lib/web/embed"
import { getUserPageUrl } from "../../pages/user/[id]"

export function Username({
  user,
  className,
}: {
  user: User
  className?: string
}) {
  const embedded = useIsEmbedded()

  return (
    <Link
      href={getUserPageUrl(user)}
      onClick={(e) => e.stopPropagation()}
      className="no-underline hover:underline"
      target={embedded ? "_blank" : undefined}
    >
      <span className={clsx(className)}>
        <Image
          src={user?.image || "/default_avatar.png"}
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
