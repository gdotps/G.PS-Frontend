import { MyApplication } from "../types";
import { API_BASE_URL, refreshAccessToken } from "./authService";

interface ApiResponseEnvelope<T> {
  message: string;
  code: string;
  data: T;
  success: boolean;
}

export interface MyApplicationListResponse {
  content: MyApplication[];
  pageable: { pageNumber: number; pageSize: number };
  last: boolean;
}

export type FetchMyApplicationsResult =
  | { status: "success"; data: MyApplicationListResponse }
  | { status: "unauthorized" }
  | { status: "error" };

// GET /api/v1/users/me/applications — 내가 신청한 모임 목록 조회
export const fetchMyApplications = async (
  page: number = 0,
  size: number = 10,
): Promise<FetchMyApplicationsResult> => {
  try {
    const url = `${API_BASE_URL}/api/v1/users/me/applications?page=${page}&size=${size}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) return { status: "unauthorized" };

      const retryResponse = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!retryResponse.ok) return { status: "error" };

      const retryResult: ApiResponseEnvelope<MyApplicationListResponse> =
        await retryResponse.json();
      if (!retryResult.success || !retryResult.data) return { status: "error" };
      return { status: "success", data: retryResult.data };
    }

    if (!response.ok) return { status: "error" };

    const result: ApiResponseEnvelope<MyApplicationListResponse> =
      await response.json();
    if (!result.success || !result.data) return { status: "error" };

    return { status: "success", data: result.data };
  } catch {
    return { status: "error" };
  }
};
