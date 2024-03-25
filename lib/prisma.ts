import { PrismaClient } from "@prisma/client"

// Intialise prisma, use this method to avoid multiple intialisations in `next dev`
// Source: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices#solution
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["info", "warn", "error"]
        : ["warn", "error"],
  })
export default prisma
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
