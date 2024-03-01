import { NextSeo } from "next-seo"
import { Notifications } from "../components/Notifications"

export default function NotificationsPage() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl bg-white">
      <NextSeo title="Notifications" />
      <div className="mx-auto">
        <Notifications />
      </div>
    </div>
  )
}
