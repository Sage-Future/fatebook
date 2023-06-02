import { signIn, signOut, useSession } from "next-auth/react"
import Image from "next/image"

export function Navbar() {
  const { data: session } = useSession()

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    imageUrl: session?.user?.image ?? "/default_avatar.png",
  }

  return (
    <div className="navbar bg-base-100 max-w-5xl mx-auto">
      <div className="flex-1">
        <a className="btn btn-ghost normal-case text-xl">Fatebook</a>
      </div>
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
          <button className="btn normal-case" onClick={() => void signIn()}>Sign in or create an account</button>
        }
      </div>
    </div>
  )
}