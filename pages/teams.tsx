import { useState, useMemo, useRef, useEffect } from "react";
import { NextSeo } from "next-seo";
import { UserLists } from "../components/UserLists";
import { useUserId } from "../lib/web/utils";
import { Tournaments } from "../components/Tournaments";
import { api } from "../lib/web/trpc";
import { TeamListContent } from "../components/TeamListContent";
import { TournamentContent } from "../components/TournamentContent";
import { signInToFatebook } from "../lib/web/utils";
// import { useSwipeable } from "react-swipeable";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleDownIcon, ChevronDoubleUpIcon } from "@heroicons/react/20/solid";
import { ChevronLeftIcon as ChevronLeftIconLarge, ChevronRightIcon as ChevronRightIconLarge } from "@heroicons/react/24/solid";
import Link from 'next/link';

export default function TeamsPage() {
  const userId = useUserId();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // TODO: uncomment this when react-swipeable import is fixed
  // const swipeHandlers = useSwipeable({
  //   onSwipedLeft: handleNext,
  //   onSwipedRight: handlePrevious,
  //   preventScrollOnSwipe: true,
  //   trackMouse: true,
  //   trackTouch: true,
  //   delta: 50,
  //   swipeDuration: 500,
  // });
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

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

  const isOverviewDisplayed = currentItem.type === 'overview';

  return (
    <div 
      className="px-4 pt-12 pb-20 lg:pt-16 lg:pb-4 mx-auto max-w-6xl flex flex-col relative"
      // {...swipeHandlers}
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
      {userId && !isOverviewDisplayed && (
        <div className="prose hidden lg:block mb-4 mx-auto">
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(items.findIndex(item => item.type === 'overview'));
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Return to teams & tournaments overview
          </Link>
        </div>
      )}
        {userId && (
          <div className="prose mx-auto flex flex-col gap-8">
            {currentItem.type === 'overview' ? (
              currentItem.component
            ) : currentItem.type === 'userList' ? (
              <TeamListContent userList={currentItem.data} userId={userId} />
            ) : (
              <TournamentContent tournament={currentItem.data} />
            )}
          </div>
        )}
      </div>
      {userId && (
        <>
          {isDrawerOpen && (
            <div 
              className="fixed top-16 inset-0 bg-black bg-opacity-30 z-10 transition-all duration-500"
              onClick={closeDrawer}
            ></div>
          )}
          <div className={`fixed lg:hidden bottom-16 left-0 right-0 bg-white border-t border-gray-200 transition-all duration-300 z-20 ${isDrawerOpen ? 'h-[80vh]' : 'h-16'}`}>
            <div className="flex justify-between items-center max-w-6xl mx-auto p-4">
              <button 
                onClick={handlePrevious}
                className="btn text-primary lg:hidden"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={toggleDrawer}
                className="flex items-center justify-center flex-grow"
              >
                <span className="text-lg font-semibold text-center truncate">
                  {truncateName(currentItem.name, 20)}
                </span>
                {isDrawerOpen ? (
                  <ChevronDoubleDownIcon className="w-6 h-6 text-primary" />
                ) : (
                  <ChevronDoubleUpIcon className="w-6 h-6 text-primary" />
                )}
              </button>
              <button 
                onClick={handleNext}
                className="btn text-primary lg:hidden"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
            {isDrawerOpen && (
              <div className="p-4 overflow-y-auto h-[calc(100%-4rem)] lg:h-auto">
                <Tournaments />
                <UserLists />
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <button 
              onClick={handlePrevious}
              className="fixed left-[calc(50%-500px)] top-1/2 transform -translate-y-1/2 btn-ghost text-neutral-300 rounded-full hover:bg-transparent hover:left-[calc(50%-505px)] transition-all duration-200"
            >
              <ChevronLeftIconLarge className="w-32 h-32" />
            </button>
            <button 
              onClick={handleNext}
              className="fixed right-[calc(50%-500px)] top-1/2 transform -translate-y-1/2 btn-ghost text-neutral-300 rounded-full hover:bg-transparent hover:right-[calc(50%-505px)] transition-all duration-200"
            >
              <ChevronRightIconLarge className="w-32 h-32" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
