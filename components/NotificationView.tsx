import React from "react";
import { Notification } from "../types";
import { Header } from "./Header";
import {
  ChevronLeft,
  MessageSquare,
  Users,
  Info,
  Bell,
  MessageCircleMore,
} from "lucide-react";

export const NotificationView: React.FC<{
  notifications: Notification[];
  onBack: () => void;
}> = ({ notifications, onBack }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "COMMENT":
        return <MessageSquare size={16} className="text-white" />;
      case "JOIN":
        return <Users size={16} className="text-white" />;
      case "CHAT":
        return <MessageCircleMore size={16} className="text-white" />;
      case "SYSTEM":
        return <Info size={16} className="text-white" />;
      default:
        return <Bell size={16} className="text-white" />;

      // 알림 종류
      /*
      1. 댓글 - 완료 
      2. 누군가가 내 게시글에 지원함 
      3. 채팅 알림 
      4. 지원 후 조인상태 - 완료 
      */
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "COMMENT":
        return "bg-gray-400";
      case "JOIN":
        return "bg-gps-500"; // Join events feel special, keep yellow
      case "CHAT":
        return "bg-blue-500";
      case "SYSTEM":
        return "bg-gray-400";
      default:
        return "bg-gps-500";
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Header leftIcon={<ChevronLeft />} onLeftClick={onBack} title="알림" />
      <div className="pt-16 px-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
            <Bell size={48} className="mb-4 opacity-20" />
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex gap-4 p-4 rounded-2xl transition-colors ${notif.isRead ? "bg-white" : "bg-gray-50"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getBgColor(notif.type)}`}
              >
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-snug mb-1">
                  {notif.message}
                </p>
                <span className="text-xs text-gray-400">
                  {new Date(notif.timestamp).toLocaleDateString()}{" "}
                  {new Date(notif.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {/* Red Point for Unread */}
              {!notif.isRead && (
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
