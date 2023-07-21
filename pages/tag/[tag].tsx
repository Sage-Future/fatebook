import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { Questions } from '../../components/Questions'
import { api, getClientBaseUrl } from '../../lib/web/trpc'
import { useUserId } from '../../lib/web/utils'

export function getTagPageUrl(tagName: string, useRelativePath?: boolean) {
  return `${getClientBaseUrl(useRelativePath)}/tag/${encodeURIComponent(tagName)}`
}

export default function TagPage() {
  const router = useRouter()
  const tagName = decodeURIComponent(router.query.tag as string)
  const userId = useUserId()

  const tagQ = api.tags.getByName.useQuery({
    tagName
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={tagQ.data?.name} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {
            !userId && <>
              <h3 className="text-neutral-600">Sign in to view your tags</h3>
            </>
          }
          {
            tagQ.data ?
              <Questions
                title={tagQ.data?.name ? `Your “${tagQ.data.name}” questions` : "Loading..."}
                filterTagIds={[tagQ.data.id]}
                noQuestionsText='No questions tagged with this tag yet.'
              />
              :
              <h3 className="text-neutral-600">{tagQ.isLoading ? "Loading..." : ""}</h3>
          }
        </div>
      </div>
    </div>
  )
}
