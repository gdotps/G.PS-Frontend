import { User, Post, UpdateProfileRequest, UpdateNotificationRequest, WithdrawResponse } from "../types";
import { CURRENT_USER } from "../constants";
import { apiClient } from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await apiClient<ApiResponse<User>>("/api/v1/users/me");
    return res.data;
  } catch {
    return null;
  }
};

export const updateUserProfile = async (data: UpdateProfileRequest): Promise<User> => {
  const res = await apiClient<ApiResponse<User>>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
};

export const logoutUser = async (): Promise<void> => {
  await apiClient<ApiResponse<null>>("/api/v1/auth/logout", {
    method: "POST",
  });
};

export const withdrawUser = async (): Promise<{ message: string; data: WithdrawResponse }> => {
  const res = await apiClient<ApiResponse<WithdrawResponse>>("/api/v1/users/withdraw", {
    method: "DELETE",
  });
  return { message: res.message, data: res.data };
};

export const updateNotificationSetting = async (
  notificationEnabled: boolean,
): Promise<UpdateNotificationRequest> => {
  const res = await apiClient<ApiResponse<UpdateNotificationRequest>>(
    "/api/v1/users/me/notifications",
    {
      method: "PATCH",
      body: JSON.stringify({ notificationEnabled }),
    },
  );
  return res.data;
};

export const getUserInfo = (userId: number, posts: Post[]): User => {
  if (userId === CURRENT_USER.userId) return CURRENT_USER;

  const authorPost = posts.find((p) => p.authorId === userId);
  if (authorPost)
    return {
      userId: userId,
      nickname: authorPost.authorName,
      profileUrl: authorPost.authorAvatar,
      notificationEnabled: false,
    };

  for (const p of posts) {
    if (p.applicants) {
      const applicant = p.applicants.find((a) => a.userId === userId);
      if (applicant) return applicant;
    }
  }

  return {
    userId: userId,
    nickname: "알 수 없음",
    profileUrl: `https://ui-avatars.com/api/?name=${userId}&background=random`,
    notificationEnabled: false,
  };
};
