import { apiClient } from "./apiClient";

export type NotificationEventType =
  | "APPLICATION_CREATED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "COMMENT_CREATED";

export interface NotificationEventRequest {
  eventType: NotificationEventType;
  actorUserId: number;
  recipientUserIds: number[];
  postId: number;
  commentId?: number;
  parentCommentId?: number | null;
  resourceType: "POST" | "COMMENT" | "APPLICATION";
  resourceId: number;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface NotificationEventResponse {
  notificationIds: number[];
}

const NOTIFICATION_EVENT_ENDPOINT = "/api/v1/notifications/events";

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

export const getMyNotifications = async (
  page: number = 0,
  size: number = 20,
): Promise<NotificationListResponse> => {
  const response = await apiClient<ApiResponse<NotificationListResponse>>(
    `${NOTIFICATIONS_ENDPOINT}?page=${page}&size=${size}`,
    {
      method: "GET",
    },
  );

  return response.data;
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

export const createNotificationEvent = async (
  request: NotificationEventRequest,
): Promise<NotificationEventResponse> => {
  const response = await apiClient<ApiResponse<NotificationEventResponse>>(
    NOTIFICATION_EVENT_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );

  return response.data;
};
