// Exposes the Prediction component solo so it can be embedded as desired

import React from "react"
import PredictModal from "../../components/PredictModal"
import {
  useListenForSessionReload,
  useRespondToPing,
} from "../../lib/web/embed"

export default function PredictModalEmbed() {
  useListenForSessionReload()
  useRespondToPing()

  return <PredictModal />
}

// Strips away the header and footer
PredictModalEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}
