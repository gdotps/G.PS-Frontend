import {
  ApplicantInfo,
  ApplicantPostSummary,
  Comment,
  Post,
  PostViewer,
  User,
} from "../types";
import { getAccessToken } from "./authService";
import { apiClient } from "./apiClient";

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
    commentId?: number;
    id?: number;
    author?: string;
    authorName?: string;
    authorId?: number;
    authorAvatar?: string;
    content?: string;
    text?: string;
    createdAt?: string;
    timestamp?: number;
    children?: Array<{
      commentId?: number;
      id?: number;
      author?: string;
      authorName?: string;
      authorId?: number;
      authorAvatar?: string;
      content?: string;
      text?: string;
      createdAt?: string;
      timestamp?: number;
    }>;
  }>;
  viewer?: {
    isAuthor?: boolean;
    isScrapped?: boolean;
    hasApplied?: boolean;
  };
  applicants?: Array<{
    userId?: number;
    id?: number;
    nickname?: string;
    name?: string;
    profileUrl?: string;
    avatarUrl?: string;
    introduction?: string;
  }>;
}

export interface PostCreateResponse {
  postId: number;
}

interface ApplicantInfoResponse {
  userId: number;
  nickname: string;
  profileUrl: string | null;
  introduction?: string | null;
  status: ApplicantInfo["status"];
  appliedAt: string;
}

interface ApplicantPostSummaryResponse {
  postId: number;
  title: string;
  category: string;
  locationName: string;
  meetingTime: string;
  maxMembers: number;
  currentMembers: number;
  applicantCount: number;
}

interface ApplicantStatusRequest {
  userId: number;
  status: ApplicantInfo["status"];
}

interface ApplicantStatusResponse {
  userId: number;
  status: ApplicantInfo["status"];
}

interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}

interface CreateCommentResponse {
  commentId: number;
  content: string;
  authorNickname: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApplyToPostResponse {
  applicationId?: number;
  postId?: number;
  status?: string;
}

interface CancelPostApplicationResponse {
  applicationId?: number;
  postId?: number;
  canceled?: boolean;
  status?: string;
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

const parseCommentTimestamp = (value?: string | number | null): number => {
  if (typeof value === "number") return value;
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

const mapNestedComment = (
  comment:
    | NonNullable<PostResponse["comments"]>[number]
    | NonNullable<
        NonNullable<PostResponse["comments"]>[number]["children"]
      >[number],
): Comment => ({
  id: comment.commentId ?? comment.id ?? 0,
  authorId: comment.authorId ?? 0,
  authorName: comment.authorName ?? comment.author ?? "",
  authorAvatar: comment.authorAvatar,
  text: comment.content ?? comment.text ?? "",
  timestamp: parseCommentTimestamp(comment.createdAt ?? comment.timestamp),
  replies:
    "children" in comment && Array.isArray(comment.children)
      ? comment.children.map((child) => mapNestedComment(child))
      : [],
});

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
    post.comments?.map((comment) => mapNestedComment(comment)) ?? [],
  applicants:
    post.applicants?.map(
      (applicant): User => ({
        userId: applicant.userId ?? applicant.id ?? 0,
        nickname: applicant.nickname ?? applicant.name ?? "",
        profileUrl: applicant.profileUrl ?? applicant.avatarUrl ?? "",
        introduction: applicant.introduction,
      }),
    ) ?? [],
  viewer: post.viewer
    ? ({
        isAuthor: post.viewer.isAuthor,
        isScrapped: post.viewer.isScrapped,
        hasApplied: post.viewer.hasApplied,
      } satisfies PostViewer)
    : undefined,
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

export const applyToPost = async (
  postId: number,
): Promise<ApplyToPostResponse> => {
  const res = await apiClient<ApiResponse<ApplyToPostResponse>>(
    `/api/v1/posts/${postId}/applications`,
    {
      method: "POST",
    },
  );
  return res.data;
};

export const cancelPostApplication = async (
  postId: number,
): Promise<CancelPostApplicationResponse> => {
  const res = await apiClient<ApiResponse<CancelPostApplicationResponse>>(
    `/api/v1/posts/${postId}/applications`,
    {
      method: "DELETE",
    },
  );
  return res.data;
};

export const fetchPostApplicants = async (
  postId: number,
): Promise<ApplicantInfo[]> => {
  const res = await apiClient<ApiResponse<ApplicantInfoResponse[]>>(
    `/api/v1/posts/${postId}/applications`,
  );

  return res.data.map((applicant) => ({
    userId: applicant.userId,
    nickname: applicant.nickname,
    profileUrl: applicant.profileUrl,
    introduction: applicant.introduction ?? "",
    status: applicant.status,
    appliedAt: applicant.appliedAt,
  }));
};

export const fetchMyApplicantPosts = async (): Promise<ApplicantPostSummary[]> => {
  const res = await apiClient<ApiResponse<ApplicantPostSummaryResponse[]>>(
    "/api/v1/posts/applications/my",
  );

  return res.data.map((post) => ({
    postId: post.postId,
    title: post.title,
    category: post.category,
    locationName: post.locationName,
    meetingTime: post.meetingTime,
    maxMembers: post.maxMembers,
    currentMembers: post.currentMembers,
    applicantCount: post.applicantCount,
  }));
};

export const changePostApplicantStatus = async (
  postId: number,
  request: ApplicantStatusRequest,
): Promise<ApplicantStatusResponse> => {
  const res = await apiClient<ApiResponse<ApplicantStatusResponse>>(
    `/api/v1/posts/${postId}/applicants`,
    {
      method: "PATCH",
      body: JSON.stringify(request),
    },
  );

  return res.data;
};

export const createComment = async (
  postId: number,
  request: CreateCommentRequest,
): Promise<CreateCommentResponse> => {
  const res = await apiClient<ApiResponse<CreateCommentResponse>>(
    `/api/v1/posts/${postId}/comments`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

  return res.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await apiClient<ApiResponse<void>>(`/api/v1/comments/${commentId}`, {
    method: "DELETE",
  });
};
