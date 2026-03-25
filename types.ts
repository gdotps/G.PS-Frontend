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
  MY_APPLICATIONS = "MY_APPLICATIONS",
}

export type Category = "SPORTS" | "STUDY" | "FOOD" | "HOBBY" | "GAME" | "MUSIC" | "ETC";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface MyApplication {
  applicationId: number;
  postId: number;
  title: string;
  category: Category;
  status: ApplicationStatus;
  meetingTime: string | null;
  locationName: string | null;
  postImageUrl: string | null;
}

export interface User {
  id: number;
  nickname: string;
  avatarUrl: string;
  isSanggyeongJwi: boolean;
  hometown?: string;
  introduction?: string;
  notificationEnabled?: boolean;
}

export interface Comment {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: number;
}

export interface Post {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  category: Category;
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
  id: number;
  senderId: number;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ChatRoom {
  id: number;
  postId: number;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: number[]; // User ID
  messages: Message[];
}

export interface Notification {
  id: number;
  type: "COMMENT" | "JOIN" | "SYSTEM" | "CHAT" | "APPLY";
  message: string;
  timestamp: number;
  isRead: boolean;
  relatedId?: number;
}
