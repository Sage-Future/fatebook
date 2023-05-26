import * as trpcNext from '@trpc/server/adapters/next'
import { appRouter } from '../../../lib/web/app_router'

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
})