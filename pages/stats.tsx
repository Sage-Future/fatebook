import { NextSeo } from 'next-seo'
import { TrackRecord } from '../components/TrackRecord'

export default function ImportPage() {


  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Stats" />
      <div className="mx-auto">
        <TrackRecord />
      </div>
    </div>
  )
}