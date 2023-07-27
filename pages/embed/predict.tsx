// Exposes the Prediction component solo so it can be embeded as desired

import React from "react"
import { Predict } from "../../components/Predict"


export default function PredictEmbed() {
  return <Predict />
}

// Strips away the header and footer
PredictEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}