import * as trpcNext from "@trpc/server/adapters/next"
import { appRouter } from "../../../lib/web/app_router"
import { createContext } from "../../../lib/web/trpc_base"

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(error)
    }
  },
})
