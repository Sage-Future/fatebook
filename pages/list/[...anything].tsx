import { useRouter } from "next/router"
import { useEffect } from "react"

export default function ListRedirect() {
  const router = useRouter()
  const { anything } = router.query

  useEffect(() => {
    if (Array.isArray(anything)) {
      const path = anything.join("/")
      void router.replace(`/team/${path}`)
    } else if (anything) {
      void router.replace(`/team/${anything}`)
    }
  }, [anything, router])

  return null
}
