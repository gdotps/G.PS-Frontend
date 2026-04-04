import { Post } from "../types";
import { getAccessToken } from "./authService";

const API_BASE_URL = "http://localhost:8080";

export interface PostRequest {
  title: string;
  content: string;
  category: string;
  meetingType: "OFFLINE" | "ONLINE";
  meetingTime: string;
  maxMembers: number;
  locationName?: string | null;
  imageUrls?: string[];
}

export interface PostResponse {
  postId: number;
  title: string;
  content: string;
  description?: string | null;
  category: string;
  meetingType: "OFFLINE" | "ONLINE";
  locationName?: string | null;
  location?: string | null;
  lat?: number | null;
  lng?: number | null;
  meetingTime: string;
  maxMembers: number;
  currentMembers: number;
  images?: string[];
  imageUrls?: string[];
  imageUrl?: string | null;
  createdAt?: number | string | null;
  author?: {
    userId?: number;
    nickname?: string;
    profileUrl?: string;
    id?: number;
    name?: string;
    avatarUrl?: string;
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

type HomePostsPayload =
  | PostResponse[]
  | {
      content?: PostResponse[];
      posts?: PostResponse[];
      items?: PostResponse[];
    };

const normalizeHomePostsPayload = (
  payload: HomePostsPayload,
): PostResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.posts)) return payload.posts;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const mapPostResponseToPost = (post: PostResponse): Post => ({
  id: post.postId,
  authorId: post.author?.userId ?? post.author?.id ?? 0,
  authorName: post.author?.nickname ?? post.author?.name ?? "",
  authorAvatar: post.author?.profileUrl ?? post.author?.avatarUrl ?? "",
  title: post.title,
  description: post.content ?? post.description ?? "",
  category: post.category,
  meetingType: post.meetingType,
  location:
    post.meetingType === "ONLINE"
      ? "ONLINE"
      : (post.locationName ?? post.location ?? ""),
  distance: "",
  lat: post.lat ?? undefined,
  lng: post.lng ?? undefined,
  maxMembers: post.maxMembers,
  currentMembers: post.currentMembers,
  time: post.meetingTime,
  tags: [],
  imageUrl:
    post.images?.[0] ?? post.imageUrls?.[0] ?? post.imageUrl ?? undefined,
  images: post.images ?? post.imageUrls,
  createdAt:
    typeof post.createdAt === "number"
      ? post.createdAt
      : typeof post.createdAt === "string"
        ? Date.parse(post.createdAt) || Date.now()
        : Date.now(),
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
  const json: ApiResponse<HomePostsPayload> = await res.json();
  return normalizeHomePostsPayload(json.data).map(mapPostResponseToPost);
};

export const fetchPostById = async (postId: number): Promise<Post> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/posts/${postId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch post: ${res.status} ${errText}`);
  }
  const json: ApiResponse<PostResponse> = await res.json();
  return mapPostResponseToPost(json.data);
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
  return json.data;
};
