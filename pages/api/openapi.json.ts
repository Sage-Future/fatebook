import { NextApiRequest, NextApiResponse } from "next"
import { openApiDocument } from "../../lib/web/app_router"

export default function openApiRoute(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.status(200).json(openApiDocument)
}
