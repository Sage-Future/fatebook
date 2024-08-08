export interface QuestionTypeProps {
  small?: boolean
  resolveByButtons?: { date: Date; label: string }[]
  questionDefaults?: {
    title?: string
    tournamentId?: string
    resolveBy?: Date
    shareWithListIds?: string[]
    sharePublicly?: boolean
    unlisted?: boolean
  }
  embedded?: boolean
  onSubmit: (data: any) => void
  highlightResolveBy: boolean
}
