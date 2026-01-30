export enum ViewState {
  ONBOARDING = "ONBOARDING",
  PROFILE_SETUP = "PROFILE_SETUP",
  HOME = "HOME",
  MAP = "MAP",
  CHAT_LIST = "CHAT_LIST",
  CHAT_ROOM = "CHAT_ROOM",
  PROFILE = "PROFILE",
  CREATE_POST = "CREATE_POST",
  POST_DETAIL = "POST_DETAIL",
  PROFILE_EDIT = "PROFILE_EDIT",
  NOTIFICATIONS = "NOTIFICATIONS",
  BOOKMARKS = "BOOKMARKS",
  APPLICANTS = "APPLICANTS",
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isSanggyeongJwi: boolean;
  hometown?: string;
  introduction?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: "FOOD" | "HOBBY" | "STUDY" | "EXERCISE" | "OTHER";
  location: string;
  distance: string;
  lat?: number;
  lng?: number;
  maxMembers: number;
  currentMembers: number;
  time: string;
  tags: string[];
  imageUrl?: string;
  images?: string[];
  createdAt: number;
  comments: Comment[];
  applicants?: User[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ChatRoom {
  id: string;
  postId: string;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: string[]; // User ID
  messages: Message[];
}

export interface Notification {
  id: string;
  type: "COMMENT" | "JOIN" | "SYSTEM";
  message: string;
  timestamp: number;
  isRead: boolean;
  relatedId?: string;
}
