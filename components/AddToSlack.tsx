import Image from "next/image"
import Link from "next/link"

export function AddToSlack() {
  return (
    <Link href="https://slack.com/oauth/v2/authorize?client_id=4955242924002.5050704938535&scope=chat:write,chat:write.public,commands,conversations.connect:read,im:read,im:write,team:read,users:read,users:read.email&user_scope=">
      <button className="my-4 text-xl bg-white text-black hover:bg-indigo-50">
        <>
          <Image src="/slack-logo.svg" width={40} height={40} className="m-0" alt="" />
          <span>{"Add to Slack"}</span>
        </>
      </button>
    </Link>
  )
}