import { LikeResponse } from "../types";
import { apiClient } from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const toggleLike = async (targetId: number): Promise<LikeResponse> => {
  const res = await apiClient<ApiResponse<LikeResponse>>("/api/v1/likes", {
    method: "POST",
    body: JSON.stringify({ targetId }),
  });
  return res.data;
};
