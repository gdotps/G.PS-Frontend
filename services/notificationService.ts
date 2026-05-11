import { apiClient } from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface NotificationResponse {
  notificationId: number;
  eventType: string;
  resourceType: string;
  resourceId: number;
  actorUserId: number;
  actorNickname: string;
  postId?: number;
  commentId?: number;
  chatRoomId?: number;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO string
  readAt?: string; // ISO string
}

interface NotificationListResponse {
  content: NotificationResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

const NOTIFICATIONS_ENDPOINT = "/api/v1/notifications";

export const getMyNotifications = async (): Promise<NotificationResponse[]> => {
  try {
    const response = await apiClient<ApiResponse<NotificationResponse[]>>(
      `${NOTIFICATIONS_ENDPOINT}`,
      {
        method: "GET",
      },
    );

    if (!response.data) {
      console.warn("No notification data in response:", response);
      console.log("데이터가 없습니다.");
      // 빈 배열 반환
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // 에러 발생 시에도 빈 배열 반환
    return [];
  }
};

export const markNotificationAsRead = async (
  notificationId: number,
): Promise<void> => {
  await apiClient<ApiResponse<void>>(
    `${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`,
    {
      method: "PATCH",
    },
  );
};
