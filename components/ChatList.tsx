import React from "react";
import { Post } from "../types";

export const ChatList: React.FC<{
  chats: any[]; // 타입을 유연하게 변경
  posts: Post[];
  onSelectChat: (id: number) => void;
}> = ({ chats, posts, onSelectChat }) => {
  const getPostImage = (postId: number): string | undefined => {
    const post = posts.find((item) => item.id === postId);
    if (!post) return undefined;
    if (post.imageUrl) return post.imageUrl;
    if (post.images && post.images.length > 0) return post.images[0];
    return undefined;
  };

  return (
    <div className="pt-16 pb-24 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">내가 참여하는 채팅방 목록</h2>
      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="py-20 text-center text-gray-400">참여 중인 채팅방이 없습니다.</div>
        ) : (
          chats.map((chat) => {
            const image = getPostImage(chat.postId);
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full rounded-2xl p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {image ? (
                    <img
                      src={image}
                      alt={chat.title}
                      className="w-16 h-16 rounded-full object-cover bg-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gps-100 text-gps-700 flex items-center justify-center font-bold text-xl shrink-0">
                      {chat.title.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                    {chat.title}
                  </h3>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
