import { NextSeo } from 'next-seo'
import { Questions } from '../components/Questions'

export default function PublicPage() {
  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title="Public predictions" />
      <div className="prose mx-auto lg:w-[650px]">
        <Questions
          title="Public predictions"
          showAllPublic={true}
          noQuestionsText='No public questions yet.'
        />
      </div>
    </div>
  )
}
