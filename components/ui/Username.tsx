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
  user: User | null
  className?: string
}) {
  const embedded = useIsEmbedded()
  if (!user) {
    return (
      <span className={clsx(className)}>
        <Image
          src={"/default_avatar.png"}
          width={20}
          height={20}
          className="inline m-0 mr-1.5 rounded-full select-none aspect-square"
          alt=""
        />
        <span>{"Invited user"}</span>
      </span>
    )
  }

  return (
    <Link
      href={user.name ? getUserPageUrl(user) : "#"}
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "no-underline ",
        user.name
          ? "cursor-pointer hover:underline"
          : "cursor-default font-normal italic",
      )}
      target={embedded ? "_blank" : undefined}
    >
      <span className={clsx(className)}>
        <Image
          src={user?.image || "/default_avatar.png"}
          width={20}
          height={20}
          className="inline m-0 mr-1.5 rounded-full select-none aspect-square"
          alt=""
        />
        <span>{user?.name || "Invited user"}</span>
      </span>
    </Link>
  )
}
