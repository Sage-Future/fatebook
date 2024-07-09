import React from "react"
import { QuestionType } from "@prisma/client"

interface QuestionTypeSelectProps {
  questionType: QuestionType
  setQuestionType: (type: QuestionType) => void
}

export function QuestionTypeSelect({
  questionType,
  setQuestionType,
}: QuestionTypeSelectProps) {
  return (
    <div className="flex space-x-4 mb-4">
      <button
        className={`px-4 py-2 rounded ${
          questionType === QuestionType.BINARY
            ? "bg-indigo-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.BINARY)
        }}
      >
        Binary
      </button>
      <button
        className={`px-4 py-2 rounded ${
          questionType === QuestionType.MULTIPLE_CHOICE
            ? "bg-indigo-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={(e) => {
          e.preventDefault()
          setQuestionType(QuestionType.MULTIPLE_CHOICE)
        }}
      >
        Multiple Choice
      </button>
    </div>
  )
}
