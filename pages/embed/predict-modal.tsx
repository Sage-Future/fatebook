// Exposes the Prediction component solo so it can be embeded as desired

import React from "react"
import PredictModal from "../../components/PredictModal"


export default function PredictModalEmbed() {
  return <PredictModal />
}

// Strips away the header and footer
PredictModalEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}