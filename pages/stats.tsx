import { NextSeo } from 'next-seo'
import { TrackRecord } from '../components/TrackRecord'
import { useUserId } from '../lib/web/utils'

export default function ImportPage() {
  const userId = useUserId()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Stats" />
      <div className="mx-auto">
        {userId && <TrackRecord trackRecordUserId={userId} />}
      </div>
    </div>
  )
}