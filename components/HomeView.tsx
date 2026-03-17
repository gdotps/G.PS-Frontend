import React, { useState } from "react";
import { Post, Notification } from "../types";
import { Bell, Clock, MapPin, Users } from "lucide-react";

export const HomeView: React.FC<{
  posts: Post[];
  notifications: Notification[];
  onViewPost: (post: Post) => void;
  onOpenNotifications: () => void;
}> = ({ posts, notifications, onViewPost, onOpenNotifications }) => {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const hasUnread = notifications.some((n) => !n.isRead);

  const CATEGORIES = [
    { id: "ALL", label: "전체" },
    { id: "SPORTS", label: "🏃 스포츠" },
    { id: "FOOD", label: "🍽 맛집" },
    { id: "STUDY", label: "📚 스터디" },
    { id: "HOBBY", label: "🎨 취미" },
    { id: "GAME", label: "🎮 게임" },
    { id: "MUSIC", label: "🎵 음악" },
    { id: "ETC", label: "🎸 기타" },
  ];

  const filteredPosts =
    activeCategory === "ALL"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  return (
    <div className="pt-16 pb-24 px-4 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">
            서울시 강남구 역삼동
          </p>
          <h2 className="text-2xl font-bold text-gray-900">내 주변 팟 찾기</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenNotifications}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative"
          >
            <Bell size={20} />
            {/* Red Point for Notifications */}
            {hasUnread && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></span>
            )}
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? "bg-gray-900 text-white shadow-md shadow-gray-200"
                : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Post List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>해당 카테고리의 모임이 없습니다.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onViewPost(post)}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Category Label: Yellow Point Color (gps-100) */}
                  <span className="bg-gps-100 text-gray-900 text-xs px-2 py-1 rounded-md font-bold">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {post.time}
                  </span>
                </div>
                {/* Distance: Minimal Highlight */}
                <span className="text-gray-900 text-xs font-bold">
                  {post.distance}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1 leading-snug group-hover:text-gray-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                {post.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  {post.location}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                  <Users size={14} className="text-gray-500" />
                  {post.currentMembers}/{post.maxMembers}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
