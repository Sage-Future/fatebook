import { User } from "@prisma/client"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useIsEmbedded } from "../../lib/web/embed"
import { getUserPageUrl } from "../../pages/user/[id]"
import { InfoButton } from "./InfoButton"

export function Username({
  user,
  className,
  unknownUserText = "Anonymous",
  unknownUserReason = "",
}: {
  user: User | null
  className?: string
  unknownUserText?: string
  unknownUserReason?: string
}) {
  const embedded = useIsEmbedded()
  if (!user) {
    const anonymousUsername = (
      <span className={clsx(className)}>
        <Image
          src={"/anonymous_avatar.png"}
          width={20}
          height={20}
          className="inline m-0 mr-1.5 rounded-full select-none aspect-square"
          alt=""
        />
        <span>{unknownUserText}</span>
      </span>
    )

    return unknownUserReason ? (
      <InfoButton tooltip={unknownUserReason} showInfoButton={false}>
        {anonymousUsername}
      </InfoButton>
    ) : (
      anonymousUsername
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
        <span>{user?.name || unknownUserText}</span>
      </span>
    </Link>
  )
}
