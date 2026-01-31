import { User, Post } from "../types";
import { CURRENT_USER } from "../constants";

export const getUserInfo = (userId: number, posts: Post[]): User => {
  if (userId === CURRENT_USER.id) return CURRENT_USER;

  // Check authors
  const authorPost = posts.find((p) => p.authorId === userId);
  if (authorPost)
    return {
      id: userId,
      name: authorPost.authorName,
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
    name: "알 수 없음",
    avatarUrl: `https://ui-avatars.com/api/?name=${userId}&background=random`,
    isSanggyeongJwi: false,
  };
};
