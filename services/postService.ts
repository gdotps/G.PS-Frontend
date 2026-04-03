import { Post } from "../types";
import { getAccessToken } from "./authService";

const API_BASE_URL = "http://localhost:8080";

export interface PostRequest {
  title: string;
  content: string;
  category: string;
  meetingType: "OFFLINE" | "ONLINE";
  meetingTime: string; // expects format yyyy-MM-dd HH:mm:ss
  maxMembers: number;
  locationName?: string | null;
  imageUrls?: string[];
}

export interface PostResponse {
  postId: number;
  title: string;
  content: string;
  category: string;
  meetingType: "OFFLINE" | "ONLINE";
  locationName?: string | null;
  lat?: number | null;
  lng?: number | null;
  meetingTime: string; // "yyyy-MM-dd HH:mm:ss"
  maxMembers: number;
  currentMembers: number;
  images?: string[];
  author?: {
    userId: number;
    nickname: string;
    profileUrl: string;
  };
  comments?: Array<{
    id: number;
    authorId: number;
    authorName: string;
    authorAvatar?: string;
    text: string;
    timestamp: number;
  }>;
  isAuthor?: boolean;
  isScrapped?: boolean;
}

export interface PostCreateResponse {
  postId: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const mapPostResponseToPost = (post: PostResponse): Post => ({
  id: post.postId,
  authorId: post.author?.userId ?? 0,
  authorName: post.author?.nickname ?? "",
  authorAvatar: post.author?.profileUrl ?? "",
  title: post.title,
  description: post.content,
  category: post.category,
  meetingType: post.meetingType,
  location:
    post.meetingType === "ONLINE" ? "온라인" : (post.locationName ?? ""),
  distance: "",
  lat: post.lat ?? undefined,
  lng: post.lng ?? undefined,
  maxMembers: post.maxMembers,
  currentMembers: post.currentMembers,
  time: post.meetingTime,
  tags: [],
  imageUrl: post.images?.[0],
  images: post.images,
  createdAt: Date.now(),
  comments:
    post.comments?.map((comment) => ({
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorAvatar: comment.authorAvatar,
      text: comment.text,
      timestamp: comment.timestamp,
    })) ?? [],
  applicants: [],
});

export const fetchHomePosts = async (): Promise<Post[]> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts/home`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch home posts: ${res.status} ${errText}`);
  }
  const json: ApiResponse<PostResponse[]> = await res.json();
  return json.data.map(mapPostResponseToPost);
};

export const createPost = async (
  request: PostRequest,
): Promise<PostCreateResponse> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create post: ${res.status} ${errText}`);
  }
  const json = await res.json();
  // assuming ApiResponse wrapper is used
  return json.data;
};

export const updatePost = async (
  postId: number,
  request: PostRequest,
): Promise<PostResponse> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update post: ${res.status} ${errText}`);
  }
  const json = await res.json();
  // assuming ApiResponse wrapper is used
  return json.data;
};

export const deletePost = async (postId: number): Promise<void> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to delete post: ${res.status} ${errText}`);
  }
};

export const fetchAllPosts = async (): Promise<PostResponse[]> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch posts: ${res.status} ${errText}`);
  }
  const json = await res.json();
  // assuming ApiResponse wrapper is used
  return json.data;
};
