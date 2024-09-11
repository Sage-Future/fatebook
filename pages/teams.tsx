import { useState, useMemo, useRef, useEffect } from "react";
import { NextSeo } from "next-seo";
import { UserLists } from "../components/UserLists";
import { useUserId } from "../lib/web/utils";
import { Tournaments } from "../components/Tournaments";
import { api } from "../lib/web/trpc";
import { TeamListContent } from "../components/TeamListContent";
import { TournamentContent } from "../components/TournamentContent";
import { signInToFatebook } from "../lib/web/utils";
import { useSwipeable } from "react-swipeable";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function TeamsPage() {
  const userId = useUserId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tournamentsQ = api.tournament.getAll.useQuery({});
  const userListsQ = api.userList.getUserLists.useQuery();

  const items = useMemo(() => {
    const allItems = [
      ...(userListsQ.data?.map(userList => ({
        type: 'userList' as const,
        id: userList.id,
        name: userList.name,
        data: userList
      })) || []),
      ...(tournamentsQ.data?.map(tournament => ({
        type: 'tournament' as const,
        id: tournament.id,
        name: tournament.name,
        data: tournament
      })) || []),
      {
        type: 'overview' as const,
        name: 'Overview',
        component: (
          <>
            <Tournaments />
            <UserLists />
          </>
        )
      }
    ];

    return allItems;
  }, [tournamentsQ.data, userListsQ.data]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const preventScroll = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault();
        }
      };
      container.addEventListener('touchmove', preventScroll, { passive: false });
      return () => {
        container.removeEventListener('touchmove', preventScroll);
      };
    }
  }, []);

  const currentItem = items[currentIndex];

  const truncateName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength - 3)}...`;
  };

  return (
    <div 
      className="px-4 pt-12 pb-20 lg:pt-16 mx-auto max-w-6xl flex flex-col"
      {...swipeHandlers}
      ref={containerRef}
    >
      <NextSeo title="Teams and Tournaments" />
      <div className="overflow-y-auto">
        {!userId && (
          <div className="text-center">
            <button
              className="button primary mx-auto"
              onClick={() => void signInToFatebook()}
            >
              Sign in to see all questions and add your own predictions
            </button>
          </div>
        )}
        {userId && (
          <div className="prose mx-auto flex flex-col gap-8">
            {currentItem.type === 'overview' ? (
              currentItem.component
            ) : currentItem.type === 'userList' ? (
              <TeamListContent userList={currentItem.data} userId={userId} />
            ) : (
              <TournamentContent tournament={currentItem.data} userId={userId} />
            )}
          </div>
        )}
      </div>
      {userId && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <button 
              onClick={handlePrevious}
              className="btn text-primary"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-lg font-semibold text-center mx-2 truncate" style={{ maxWidth: 'calc(100% - 200px)' }}>
              {truncateName(currentItem.name, 30)}
            </span>
            <button 
              onClick={handleNext}
              className="btn text-primary"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
