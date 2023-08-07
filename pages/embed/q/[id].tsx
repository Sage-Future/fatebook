import React from "react"
import { QuestionOrSignIn } from "../../../components/QuestionOrSignIn"


export default function QuestionEmbed() {
  return <div className="flex h-full items-center justify-center">
    <QuestionOrSignIn embedded={true} alwaysExpand={false}></QuestionOrSignIn>
  </div>
}

// Strips away the header and footer
QuestionEmbed.getLayout = function getLayout(page: React.ReactElement) {
  return page
}