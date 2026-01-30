import React from "react";
import { Home, MessageCircle, Map, User, Plus } from "lucide-react";
import { ViewState } from "../types";

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onChangeView,
}) => {
  const getIconColor = (view: ViewState) => {
    if (
      view === ViewState.HOME &&
      (currentView === ViewState.HOME || currentView === ViewState.POST_DETAIL)
    )
      return "text-gray-900";
    if (currentView === view) return "text-gray-900";
    return "text-gray-300";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe-area-bottom z-50 max-w-md mx-auto rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-2">
        <button
          onClick={() => onChangeView(ViewState.HOME)}
          className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200 ${getIconColor(ViewState.HOME)}`}
        >
          <Home
            size={24}
            strokeWidth={currentView === ViewState.HOME ? 2.5 : 2}
          />
          <span className="text-[10px] font-medium">홈</span>
        </button>

        <button
          onClick={() => onChangeView(ViewState.MAP)}
          className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200 ${getIconColor(ViewState.MAP)}`}
        >
          <Map
            size={24}
            strokeWidth={currentView === ViewState.MAP ? 2.5 : 2}
          />
          <span className="text-[10px] font-medium">지도</span>
        </button>

        <div className="relative -top-5">
          <button
            onClick={() => onChangeView(ViewState.CREATE_POST)}
            className="bg-gray-900 text-white p-4 rounded-full shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all ring-4 ring-white"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        </div>

        <button
          onClick={() => onChangeView(ViewState.CHAT_LIST)}
          className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200 ${getIconColor(ViewState.CHAT_LIST)}`}
        >
          <MessageCircle
            size={24}
            strokeWidth={currentView === ViewState.CHAT_LIST ? 2.5 : 2}
          />
          <span className="text-[10px] font-medium">채팅</span>
        </button>

        <button
          onClick={() => onChangeView(ViewState.PROFILE)}
          className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200 ${getIconColor(ViewState.PROFILE)}`}
        >
          <User
            size={24}
            strokeWidth={currentView === ViewState.PROFILE ? 2.5 : 2}
          />
          <span className="text-[10px] font-medium">마이</span>
        </button>
      </div>
    </div>
  );
};
