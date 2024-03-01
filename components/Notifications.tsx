import clsx from "clsx"
import Link from "next/link"
import { useState } from "react"
import { LoaderIcon } from "react-hot-toast"
import { InView } from "react-intersection-observer"
import { ReactMarkdown } from "react-markdown/lib/react-markdown"
import { api } from "../lib/web/trpc"
import { useUserId } from "../lib/web/utils"
import { FormattedDate } from "./FormattedDate"

export function Notifications() {
  const userId = useUserId()

  const notificationsQ = api.getUserNotifications.useInfiniteQuery(
    {
      limit: 20,
    },
    {
      initialCursor: 0, // NB: "cursor" language comes from TRPC, but we use take/skip method in Prisma
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      keepPreviousData: true,
    },
  )
  const markNotificationRead = api.markNotificationRead.useMutation({})
  const [justRead, setJustRead] = useState<string[]>([])

  const notifications = notificationsQ.data?.pages
    .flatMap((p) => p?.items)
    .filter((q) => !!q)

  if (!userId) {
    return <>Sign in to see your notifications</>
  }

  return (
    <div className="flex flex-col gap-2 max-w-full whitespace-normal no-prose prose-none text-sm text-neutral-600">
      <span className="prose pt-2 pl-4">
        <h2 className="lg:text-xl lg:font-bold">Notifications</h2>
      </span>
      {notifications?.map((notification) => {
        function read() {
          if (
            !notification ||
            notification.read ||
            justRead.includes(notification.id)
          ) {
            return
          }
          markNotificationRead.mutate({ notificationId: notification.id })
          setJustRead((justRead) => [...justRead, notification.id])
        }
        return (
          notification && (
            <Link href={notification.url || "#"}>
              <div
                key={notification.id}
                className={clsx(
                  "py-2 px-4 rounded-lg hover:cursor-pointer hover:shadow-md transition-all",
                  notification.read || justRead?.includes(notification.id)
                    ? "bg-neutral-50 hover:bg-neutral-100"
                    : "bg-indigo-50 hover:bg-indigo-100",
                )}
                onMouseEnter={read}
                onClick={read}
              >
                <ReactMarkdown
                  components={{
                    a: ({ href, children, ...props }) => (
                      <Link href={href ?? ""} {...props}>
                        {children}
                      </Link>
                    ),
                  }}
                >
                  {notification.content}
                </ReactMarkdown>
                <FormattedDate
                  date={notification.createdAt}
                  capitalise={true}
                  className="w-full text-neutral-400"
                />
              </div>
            </Link>
          )
        )
      })}
      {!notifications && !notificationsQ.isFetching && (
        <div className="text-neutral-400 italic px-4">
          No notifications yet. Share some predictions with your friends or
          teammates!
        </div>
      )}
      <InView>
        {({ inView, ref }) => {
          if (inView && notificationsQ.hasNextPage) {
            void notificationsQ.fetchNextPage()
          }
          return <div ref={ref} />
        }}
      </InView>
      {(notificationsQ.isFetchingNextPage || notificationsQ.isRefetching) && (
        <div className="flex justify-center">
          <LoaderIcon />
        </div>
      )}
    </div>
  )
}
