import { signIn, signOut, useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

export function Navbar({
  showForSlackButton = true,
  showCreateAccountButton = true,
}: {
  showForSlackButton?: boolean
  showCreateAccountButton?: boolean
}) {
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    imageUrl: session?.user?.image ?? "/default_avatar.png",
  }

  return (
    <div className="navbar max-w-5xl mx-auto gap-4">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost normal-case text-xl">Fatebook</Link>
      </div>
      {showForSlackButton && <Link href="/for-slack">
        <button className="btn ghost normal-case">Try Fatebook for Slack</button>
      </Link>}
      <div className="flex-none">
        {user.email ?
          <details className="dropdown dropdown-end">
            <summary tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <Image src={user.imageUrl} width={40} height={40} alt={user.name} />
              </div>
            </summary>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-1 p-2 shadow bg-base-100 rounded-box w-52">
              <li className="px-3 py-2 text-neutral-500 select-none">Signed in as {user.email}</li>
              <li onClick={() => void signOut()}><a>Logout</a></li>
            </ul>
          </details>
          :
          showCreateAccountButton &&
            <button className="btn normal-case" onClick={() => void signIn("google")}>Sign in or create an account</button>
        }
      </div>
    </div>
  )
}