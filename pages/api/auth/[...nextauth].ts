import NextAuth, { NextAuthOptions, Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import GoogleProvider from "next-auth/providers/google"

import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma, { backendAnalyticsEvent } from "../../../lib/_utils_server"

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
  events: {
    createUser: async () => {
      await backendAnalyticsEvent("new_user", {
        platform: "web",
      })
    },
    linkAccount: async ({ user, profile }) => {
      // if the user has no name or image, update it from the profile
      // useful for when a user is created by having a question shared with them
      if (!user.name && (profile.name)) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            name: profile.name,
          },
        })
      }

      if (!user.image && (profile.image)) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            image: profile.image,
          },
        })
      }
    }
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
