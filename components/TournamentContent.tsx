import { Username } from "./ui/Username"
import { Questions } from "./Questions"
import { TournamentWithAuthor } from "../prisma/additional"

export function TournamentContent({
  tournament,
}: {
  tournament: TournamentWithAuthor
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mt-0">{tournament.name}</h2>
      {tournament.description && <p>{tournament.description}</p>}
      <div>
        <span>Created by: </span>
        <Username
          user={tournament.author}
          className="bg-white px-2 py-1.5 rounded-full outline outline-1 outline-neutral-200 hover:bg-neutral-100"
        />
      </div>
      <Questions
        noQuestionsText="No questions in this tournament yet."
        filterTournamentId={tournament.id}
      />
    </div>
  )
}
