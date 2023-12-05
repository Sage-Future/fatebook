import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { api } from '../../../lib/web/trpc'
import { signInToFatebook, useUserId } from '../../../lib/web/utils'

export default function ListPage() {
  const userId = useUserId()
  const router = useRouter()

  // allow an optional ignored slug text before `--` character
  const parts =
    router.query.list_invite_id && (router.query.list_invite_id as string).match(/(.*)--(.*)/)
  const listInviteId = parts ? parts[2] : (router.query.list_invite_id as string) || ""

  const utils = api.useContext()
  const joinViaLink = api.userList.joinViaLink.useMutation({
    async onSettled() {
      await utils.userList.getUserLists.invalidate()
      await utils.userList.get.invalidate()
    }
  })
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!userId || isJoining) {
      return
    }

    setIsJoining(true)
    console.log({listInviteId})
    joinViaLink.mutate({
      listInviteId,
    }, {
      onSuccess(id) {
        void router.push(`/list/${id}`)
      }
    })
  }, [isJoining, joinViaLink, listInviteId, router, userId])

  return (
    <div className="px-4 pt-12 lg:pt-16 mx-auto max-w-6xl">
      <NextSeo title={"Join user list"} />
      <div className="mx-auto">
        <div className="prose mx-auto lg:w-[650px]">
          {
            !userId && <div className='text-center'>
              <button className="button primary mx-auto" onClick={() => void signInToFatebook()}>
                Sign in or sign up to join this user list
              </button>
            </div>
          }
          {
            joinViaLink.isLoading && <h3 className="text-neutral-600">
              Joining user list...
            </h3>
          }
          {
            joinViaLink.error && <h3 className="text-neutral-600">
              {"Something went wrong - we couldn't add you to the list"}
            </h3>
          }
        </div>
      </div>
    </div>
  )
}