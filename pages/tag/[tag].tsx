import { NextSeo } from "next-seo"
import { useRouter } from "next/router"
import { Questions } from "../../components/Questions"
import { api, getClientBaseUrl } from "../../lib/web/trpc"
import { useUserId } from "../../lib/web/utils"
import { CalibrationChart } from "../../components/CalibrationChart"

export function getTagPageUrl(tagName: string, useRelativePath?: boolean) {
  return `${getClientBaseUrl(useRelativePath)}/tag/${encodeURIComponent(
    tagName,
  )}`
}

export default function TagPage() {
  const router = useRouter()
  const tagName = decodeURIComponent(router.query.tag as string)
  const userId = useUserId()

  const tagQ = api.tags.getByName.useQuery({
    tagName,
  })

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={tagQ.data?.name} noindex={true} nofollow={true} />
      <div className="max-md:flex-col gap-8 lg:gap-12 flex justify-center px-4 lg:pt-4 mx-auto max-w-6xl">
        <div className="prose mx-auto lg:w-[650px]">
          {!userId && (
            <>
              <h3 className="text-neutral-600">Sign in to view your tags</h3>
            </>
          )}
          {tagQ.data ? (
            <>
              <Questions
                title={
                  tagQ.data?.name
                    ? `Your “${tagQ.data.name}” questions`
                    : "Loading..."
                }
                filterTagIds={[tagQ.data.id]}
                noQuestionsText="No questions tagged with this tag yet."
              />
            </>
          ) : (
            <h3 className="text-neutral-600">
              {tagQ.isLoading ? "Loading..." : ""}
            </h3>
          )}
        </div>
        {tagQ.data && userId && <div className="prose max-md:hidden flex flex-col gap-12 max-w-[400px]">
          <h3 className="pt-6 pb-4">Your calibration on “{tagQ.data.name}” questions</h3>
          <CalibrationChart userId={userId} tags={[tagName]} />
        </div>}
      </div>
    </div>
  )
}
