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

export interface PostCreateResponse {
  postId: number;
}

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
