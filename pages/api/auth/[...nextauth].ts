import NextAuth, { NextAuthOptions, Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { backendAnalyticsEvent } from "../../../lib/_utils_server"
import prisma from "../../../lib/prisma"

function getCookies() {
  /* Copied from:
    https://github.com/nextauthjs/next-auth/blob/c0f9af4c567a905c9d55b732cc0610d44fbae5a6/packages/core/src/lib/cookie.ts#L53
    https://github.com/nextauthjs/next-auth/blob/c0f9af4c567a905c9d55b732cc0610d44fbae5a6/packages/next-auth/src/core/init.ts#L77
  */

  const useSecureCookies = true
  const cookiePrefix = useSecureCookies ? "__Secure-" : ""

  return {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
        maxAge: 60 * 15, // 15 minutes in seconds
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: "none" as "none",
        path: "/",
        secure: useSecureCookies,
      },
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // allow slackbot users to link Google OAuth Accounts later in web
      // "dangerous" if Google does not verify the email address
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  theme: {
    colorScheme: "light",
    brandColor: "#4338ca",
    logo: "https://fatebook.io/logo.png",
  },
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.SECRET,
  },
  useSecureCookies: true,

  cookies: getCookies(),

  events: {
    createUser: async () => {
      await backendAnalyticsEvent("new_user", {
        platform: "web",
      })
    },
    linkAccount: async ({ user, profile }) => {
      // if the user has no name or image, update it from the profile
      // useful for when a user is created by having a question shared with them
      if (!user.name && profile.name) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            name: profile.name,
          },
        })
      }

      if (!user.image && profile.image) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            image: profile.image,
          },
        })
      }
    },
  },
  callbacks: {
    session: (params: { session: Session; token: JWT }) => {
      const { session, token } = params
      if (token.id && session.user) {
        session.user.id = token.id as string
      }
      return Promise.resolve(session)
    },
    jwt: (params: { token: JWT; user?: User | undefined }) => {
      const { token, user } = params
      if (user) {
        token.id = user.id
      }
      return Promise.resolve(token)
    },
  },
}

export default NextAuth(authOptions)
