import { User, Post } from "../types";
import { CURRENT_USER } from "../constants";
import { getAccessToken } from "./authService";

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return null;
    }

    const response = await fetch("http://localhost:8080/api/v1/users/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch current user:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

export const getUserInfo = (userId: number, posts: Post[]): User => {
  if (userId === CURRENT_USER.userId) return CURRENT_USER;

  // Check authors
  const authorPost = posts.find((p) => p.authorId === userId);
  if (authorPost)
    return {
      userId: userId,
      nickname: authorPost.authorName,
      profileUrl: authorPost.authorAvatar,
      notificationEnabled: false, // unknown
    };

  // Check applicants across all posts
  for (const p of posts) {
    if (p.applicants) {
      const applicant = p.applicants.find((a) => a.userId === userId);
      if (applicant) return applicant;
    }
  }

  // Fallback
  return {
    userId: userId,
    nickname: "알 수 없음",
    profileUrl: `https://ui-avatars.com/api/?name=${userId}&background=random`,
    notificationEnabled: false, // unknown
  };
};
