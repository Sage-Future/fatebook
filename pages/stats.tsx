import { NextSeo } from "next-seo"
import { Tournaments } from "../components/Tournaments"
import { TrackRecord } from "../components/TrackRecord"
import { UserLists } from "../components/UserLists"
import { QuickFeedback } from "../components/ui/QuickFeedback"
import { useUserId } from "../lib/web/utils"

export default function StatsPage() {
  const userId = useUserId()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Stats" />
      <div className="mx-auto">
        {userId && (
          <TrackRecord trackRecordUserId={userId} className="max-w-sm" />
        )}
        {userId && (
          <div className="prose mx-auto mt-14 flex flex-col gap-8">
            <Tournaments />
            <UserLists />
            <QuickFeedback
              type="Fatebook feedback"
              placeholder="Give feedback on Fatebook..."
              style="textarea"
            />
          </div>
        )}
      </div>
    </div>
  )
}
