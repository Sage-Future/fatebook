import Image from "next/image"
import Link from "next/link"

export function AddToSlack({
  buttonText = "Add to Slack",
}: {
  buttonText?: string
 }) {
  return (
    <Link href="https://fatebook.io/api/auth/install">
      <button className="my-4 text-xl bg-white text-black hover:bg-indigo-50">
        <>
          <Image src="/slack-logo.svg" width={40} height={40} className="m-0" alt="" />
          <span>{buttonText}</span>
        </>
      </button>
    </Link>
  )
}