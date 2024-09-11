import { UserListDisplay } from "./UserListDisplay";
import { Username } from "./ui/Username";
import { SyncToSlack } from "./SyncToSlack";
import { Predict } from "./predict-form/Predict";
import { Questions } from "./Questions";
import { getUserListUrl } from "../lib/web/utils";
import { api } from "../lib/web/trpc";
import { UserListWithAuthorAndUsers } from "../prisma/additional";

export function TeamListContent({ userList, userId }: { userList: UserListWithAuthorAndUsers, userId: string }) {
  const utils = api.useContext();

  return (
    <div className="flex flex-col gap-2">
      <UserListDisplay
        bigHeading={true}
        userList={userList}
      />
      <span className="block">
        A team created by:{" "}
        <Username
          user={userList.author}
          className="bg-white px-2 py-1.5 rounded-full outline outline-1 outline-neutral-200 hover:bg-neutral-100"
        />
      </span>
      <div>
        <span>Team members:</span>
        {userList.users.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-1 max-w-full">
            {userList.users.map((u) => (
              <Username
                key={u.id}
                user={u}
                className="bg-white px-2 py-1.5 rounded-full outline outline-1 outline-neutral-200 hover:bg-neutral-100 leading-8"
                unknownUserText="Invited user"
              />
            ))}
          </div>
        ) : (
          <span className="italic">none</span>
        )}
      </div>
      {userList.emailDomains.length > 0 && (
        <span className="block">
          Email domains {userList.emailDomains.join(", ")}
        </span>
      )}
      {userId && userList.authorId === userId && (
        <SyncToSlack
          listType="team"
          url={getUserListUrl(userList, false)}
          entity={userList}
        />
      )}
      <h3>Share new questions with this team</h3>
      <Predict
        questionDefaults={{
          shareWithListIds: [userList.id],
        }}
        small={true}
        onQuestionCreate={() => {
          void utils.question.getQuestionsUserCreatedOrForecastedOnOrIsSharedWith.invalidate(
            {
              extraFilters: {
                filterUserListId: userList.id,
              },
            },
          )
        }}
      />
      <Questions
        title={"Your team's questions"}
        noQuestionsText="No questions shared with this team yet."
        filterUserListId={userList.id}
      />
    </div>
  );
}