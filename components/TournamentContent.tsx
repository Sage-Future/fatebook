import { Username } from "./ui/Username";
import { SyncToSlack } from "./SyncToSlack";
import { Questions } from "./Questions";
import { getTournamentUrl } from "../lib/web/utils";
import { TournamentWithAuthor } from "../prisma/additional";

export function TournamentContent({ tournament, userId }: { tournament: TournamentWithAuthor, userId?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="mt-0">{tournament.name}</h2>
      <p>{tournament.description}</p>
      <div>
        <span>Created by: </span>
        <Username
          user={tournament.author}
          className="bg-white px-2 py-1.5 rounded-full outline outline-1 outline-neutral-200 hover:bg-neutral-100"
        />
      </div>
      {userId && tournament.authorId === userId && (
        <SyncToSlack
          listType="tournament"
          url={getTournamentUrl(tournament, false)}
          entity={tournament}
        />
      )}
      <h3>Tournament Questions</h3>
      <Questions
        title={"Tournament questions"}
        noQuestionsText="No questions in this tournament yet."
        filterTournamentId={tournament.id}
      />
    </div>
  );
}