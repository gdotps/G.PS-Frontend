import React from "react";
import { ChatRoom } from "../types";

export const ChatList: React.FC<{
  chats: ChatRoom[];
  onSelectChat: (id: number) => void;
}> = ({ chats, onSelectChat }) => {
  return (
    <div className="pt-16 pb-24 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">채팅 목록</h2>
      <div className="space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl active:bg-gray-50 transition-colors cursor-pointer group hover:bg-gray-50"
          >
            {/* Avatar Bg = Yellow for Identity */}
            <div className="w-14 h-14 bg-gps-100 rounded-full flex items-center justify-center text-gps-600 font-bold text-lg shrink-0 group-hover:bg-gps-200 transition-colors">
              {chat.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-gray-900 truncate">
                  {chat.title}
                </h3>
                <span className="text-[10px] text-gray-400">
                  {chat.lastMessageTime}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {chat.lastMessage}
              </p>
            </div>
            {/* Unread Badge = Dark Gray */}
            {chat.unreadCount > 0 && (
              <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {chat.unreadCount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
