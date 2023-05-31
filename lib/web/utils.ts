import { useSession } from "next-auth/react"

export function useUserId() {
  const session = useSession()
  return session.data?.user.id
}