import { NextApiRequest, NextApiResponse } from "next"
import cors from "nextjs-cors"
import { createOpenApiNextHandler } from "trpc-openapi"
import { appRouter } from "../../lib/web/app_router"
import { createContext } from "../../lib/web/trpc_base"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  await cors(req, res)

  // Handle incoming OpenAPI requests
  return createOpenApiNextHandler({
    router: appRouter,
    createContext,
  })(req, res)
}

export default handler
