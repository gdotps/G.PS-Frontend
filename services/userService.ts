import { User, Post } from "../types";
import { CURRENT_USER } from "../constants";
import { API_BASE_URL } from "./authService";

// 백엔드 ApiResponse<T> 공통 응답 래퍼
interface ApiResponseEnvelope<T> {
  message: string;
  code: string;
  data: T;
  success: boolean;
}

// 백엔드 UserProfileResponseDto 매칭
interface UserProfileResponseDto {
  userId: number;
  nickname: string;
  profileUrl: string | null;
  introduction: string | null;
  notificationEnabled: boolean | null;
}

// fetchMyProfile 반환 타입 (401 판별용)
export type FetchProfileResult =
  | {
      status: "success";
      data: {
        id: number;
        nickname: string;
        profileUrl: string | null;
        introduction: string | null;
        notificationEnabled: boolean;
      };
    }
  | { status: "unauthorized" }
  | { status: "error" };

// GET /api/v1/users/me — 현재 로그인한 사용자 프로필 조회
export const fetchMyProfile = async (): Promise<FetchProfileResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      return { status: "unauthorized" };
    }

    if (!response.ok) {
      return { status: "error" };
    }

    const result: ApiResponseEnvelope<UserProfileResponseDto> =
      await response.json();

    if (!result.success || !result.data) {
      return { status: "error" };
    }

    return {
      status: "success",
      data: {
        id: result.data.userId,
        nickname: result.data.nickname,
        profileUrl: result.data.profileUrl,
        introduction: result.data.introduction,
        notificationEnabled: result.data.notificationEnabled ?? false,
      },
    };
  } catch {
    return { status: "error" };
  }
};

// 백엔드 UpdateProfileResponseDto 매칭
interface UpdateProfileResponseDto {
  userId: number;
  nickname: string;
  introduction: string | null;
}

// PATCH /api/v1/users/me — 프로필 수정 (nickname, introduction)
export const updateMyProfile = async (
  data: { nickname?: string; introduction?: string },
): Promise<{ success: true; data: UpdateProfileResponseDto } | { success: false }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return { success: false };
    }

    const result: ApiResponseEnvelope<UpdateProfileResponseDto> =
      await response.json();

    if (!result.success || !result.data) {
      return { success: false };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false };
  }
};

export const getUserInfo = (userId: number, posts: Post[]): User => {
  if (userId === CURRENT_USER.id) return CURRENT_USER;

  // Check authors
  const authorPost = posts.find((p) => p.authorId === userId);
  if (authorPost)
    return {
      id: userId,
      nickname: authorPost.authorName,
      avatarUrl: authorPost.authorAvatar,
      isSanggyeongJwi: false, // unknown
    };

  // Check applicants across all posts
  for (const p of posts) {
    if (p.applicants) {
      const applicant = p.applicants.find((a) => a.id === userId);
      if (applicant) return applicant;
    }
  }

  // Fallback
  return {
    id: userId,
    nickname: "알 수 없음",
    avatarUrl: `https://ui-avatars.com/api/?name=${userId}&background=random`,
    isSanggyeongJwi: false,
  };
};
