import { XMarkIcon } from "@heroicons/react/20/solid"
import { CogIcon } from "@heroicons/react/24/solid"
import { Tournament } from "@prisma/client"
import { ShareTournament } from "./ShareTournament"
import { TournamentAdminPanel } from "./TournamentAdminPanel"

export function TournamentSettingsButton({
  teamMode,
  tournament,
}: {
  teamMode: boolean
  tournament: Tournament
}) {
  return (
    <div className="ml-auto -mb-10 right-0 top-4 flex gap-2">
      <button
        className="btn btn-primary"
        onClick={() =>
          (
            document?.getElementById("tournament_share_modal") as any
          )?.showModal()
        }
      >
        Share with your {teamMode ? "team" : "friends"}
      </button>
      <dialog id="tournament_share_modal" className="modal max-sm:modal-top">
        <div className="modal-box max-w-[100vw] sm:max-w-prose">
          <form method="dialog" className="modal-backdrop">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <XMarkIcon className="w-6 h-6 text-neutral-500" />
            </button>
          </form>
          <h3 className="font-bold text-lg mt-0">Share</h3>
          <ShareTournament tournamentId={tournament.id} />
        </div>
      </dialog>

      <button
        className="btn"
        onClick={() =>
          (
            document?.getElementById("tournament_admin_panel") as any
          )?.showModal()
        }
      >
        <CogIcon className="w-6 h-6 text-neutral-500" />
      </button>
      <dialog id="tournament_admin_panel" className="modal max-sm:modal-top">
        <div className="modal-box max-w-[100vw] sm:max-w-prose">
          <form method="dialog" className="modal-backdrop">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <XMarkIcon className="w-6 h-6 text-neutral-500" />
            </button>
          </form>
          <TournamentAdminPanel
            tournamentId={tournament.id}
            includeAddNewQuestion={false}
            includeShareTournament={false}
            collapsible={false}
          />
        </div>
      </dialog>
    </div>
  )
}
