import { NextSeo } from 'next-seo'
import { TrackRecord } from '../components/TrackRecord'
import { useUserId } from '../lib/web/utils'
import { Tournaments } from '../components/Tournaments'
import { UserLists } from '../components/UserLists'

export default function StatsPage() {
  const userId = useUserId()

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Stats" />
      <div className="mx-auto">
        {userId && <TrackRecord trackRecordUserId={userId} />}
        {userId && <div className='prose mx-auto mt-14 flex flex-col gap-8'>
          <Tournaments />
          <UserLists />
        </div>}
      </div>
    </div>
  )
}