import { getAccessToken } from "./authService";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

const API_BASE_URL = "http://localhost:8080";

export interface ChatRoomListDto {
  id: number;
  title: string;
  postId: number;
}

type ChatRoomListItemRaw = {
  id?: number | string;
  roomId?: number | string;
  chatRoomId?: number | string;
  title?: string;
  roomTitle?: string;
  postId?: number | string;
};

export interface ChatRoomUserDto {
  id: number;
  nickname: string;
  isManager: boolean;
}

export interface ChatHistoryMessageDto {
  id: string;
  roomId: number;
  sender: number;
  senderUsername: string;
  message: string;
  timestamp: string;
  messageType: "TEXT" | "IMAGE" | string;
  imageUrl: string | null;
}

export interface ChatRoomCreateRequest {
  title: string;
  postId: number;
}

export interface ChatSendMessageRequest {
  roomId: number;
  senderId: number;
  message: string;
  messageType?: "TEXT" | "IMAGE";
  imageUrl?: string | null;
}

export interface ChatIncomingMessage {
  id: string | number;
  roomId: number;
  sender: number;
  senderUsername?: string;
  message: string;
  timestamp: string | number;
  messageType?: string;
  imageUrl?: string | null;
}

type ChatIncomingRawPayload =
  | ChatIncomingMessage
  | {
      data?: Partial<ChatIncomingMessage> & {
        chatRoomId?: number | string;
        senderId?: number | string;
        text?: string;
      };
      roomId?: number | string;
      chatRoomId?: number | string;
      sender?: number | string;
      senderId?: number | string;
      message?: string;
      text?: string;
      timestamp?: string | number;
      id?: string | number;
      senderUsername?: string;
      messageType?: string;
      imageUrl?: string | null;
    };

const normalizeIncomingPayload = (
  payload: ChatIncomingRawPayload,
): ChatIncomingMessage | null => {
  const source = (payload as any)?.data ?? payload;

  const roomId = Number(source.roomId ?? source.chatRoomId);
  const sender = Number(source.sender ?? source.senderId);
  const message = source.message ?? source.text;
  const timestamp = source.timestamp ?? Date.now();

  if (!Number.isFinite(roomId) || !Number.isFinite(sender) || !message) {
    return null;
  }

  return {
    id: source.id ?? `${roomId}-${sender}-${Date.now()}`,
    roomId,
    sender,
    senderUsername: source.senderUsername,
    message,
    timestamp,
    messageType: source.messageType,
    imageUrl: source.imageUrl ?? null,
  };
};

const WS_URL = "ws://localhost:8080/ws";
const SEND_DESTINATION = "/app/sendMeassage";

class ChatStompManager {
  private client: Client | null = null;
  private activeRoomSubscription: StompSubscription | null = null;
  private activeRoomId: number | null = null;
  private connectingPromise: Promise<Client> | null = null;

  private ensureClient() {
    if (this.client) return this.client;

    const token = getAccessToken();
    this.client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      debug: () => {
        // Intentionally silent in production-like UI.
      },
    });

    return this.client;
  }

  async connect(): Promise<Client> {
    const client = this.ensureClient();
    if (client.connected) return client;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = new Promise<Client>((resolve, reject) => {
      const prevOnConnect = client.onConnect;
      const prevOnStompError = client.onStompError;
      const prevOnWebSocketError = client.onWebSocketError;

      client.onConnect = (frame) => {
        prevOnConnect?.(frame);
        this.connectingPromise = null;
        resolve(client);
      };

      client.onStompError = (frame) => {
        prevOnStompError?.(frame);
        this.connectingPromise = null;
        reject(new Error(frame.headers["message"] || "STOMP 연결 실패"));
      };

      client.onWebSocketError = (event) => {
        prevOnWebSocketError?.(event);
        this.connectingPromise = null;
        reject(new Error("웹소켓 연결 실패"));
      };

      if (!client.active) {
        client.activate();
      }
    });

    return this.connectingPromise;
  }

  async subscribeRoom(
    roomId: number,
    onMessage: (message: ChatIncomingMessage) => void,
  ) {
    const client = await this.connect();

    if (this.activeRoomId === roomId && this.activeRoomSubscription) {
      return;
    }

    this.unsubscribeRoom();

    this.activeRoomSubscription = client.subscribe(
      `/topic/room/${roomId}`,
      (frame: IMessage) => {
        try {
          const payload = JSON.parse(frame.body) as ChatIncomingRawPayload;
          const normalized = normalizeIncomingPayload(payload);
          if (!normalized) {
            console.warn("채팅 메시지 형식이 예상과 달라 무시합니다.", payload);
            return;
          }
          onMessage(normalized);
        } catch (error) {
          console.error("채팅 메시지 파싱 실패:", error);
        }
      },
    );
    this.activeRoomId = roomId;
  }

  unsubscribeRoom() {
    if (this.activeRoomSubscription) {
      this.activeRoomSubscription.unsubscribe();
      this.activeRoomSubscription = null;
      this.activeRoomId = null;
    }
  }

  async sendMessage(payload: ChatSendMessageRequest) {
    const client = await this.connect();
    client.publish({
      destination: SEND_DESTINATION,
      body: JSON.stringify({
        roomId: payload.roomId,
        senderId: payload.senderId,
        message: payload.message,
        messageType: payload.messageType ?? "TEXT",
        imageUrl: payload.imageUrl ?? null,
      }),
    });
  }
}

const chatStompManager = new ChatStompManager();

export const subscribeChatRoom = async (
  roomId: number,
  onMessage: (message: ChatIncomingMessage) => void,
) => {
  await chatStompManager.subscribeRoom(roomId, onMessage);
};

export const unsubscribeChatRoom = () => {
  chatStompManager.unsubscribeRoom();
};

export const sendChatMessage = async (payload: ChatSendMessageRequest) => {
  await chatStompManager.sendMessage(payload);
};

const parseJsonIfPossible = async (res: Response): Promise<any | null> => {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
};

const normalizeChatRooms = (payload: any): ChatRoomListDto[] => {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.data?.content)
        ? payload.data.content
        : [];

  return (rawList as ChatRoomListItemRaw[])
    .map((room) => {
      const id = Number(room.id ?? room.roomId ?? room.chatRoomId);
      const postId = Number(room.postId ?? 0);
      const title = room.title ?? room.roomTitle ?? "채팅방";

      if (!Number.isFinite(id)) return null;

      return {
        id,
        title,
        postId: Number.isFinite(postId) ? postId : 0,
      };
    })
    .filter((room): room is ChatRoomListDto => room !== null);
};

// 1. 내 채팅방 목록 조회 (GET)
export const getMyChatRooms = async (): Promise<ChatRoomListDto[]> => {
  const token = getAccessToken();
  const endpoints = [
    "/api/v1/chat/rooms/myrooms",
    "/api/v1/chat/rooms/my-rooms",
    "/api/v1/chat/rooms/my",
  ];

  let lastErrorMessage = "내 채팅방 조회 실패";

  for (const endpoint of endpoints) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });

    if (res.status === 404) {
      continue;
    }

    const json = await parseJsonIfPossible(res);

    if (!res.ok) {
      lastErrorMessage =
        json?.message || `내 채팅방 조회 실패 (${res.status})`;
      continue;
    }

    if (json?.success === false) {
      const message = String(json?.message || "");
      // 비즈니스적으로 "채팅방 없음" 응답은 정상 빈 배열로 처리
      if (message.includes("없") || message.includes("not found")) {
        return [];
      }
      lastErrorMessage = message || "내 채팅방 조회 실패";
      continue;
    }

    const normalized = normalizeChatRooms(json ?? []);
    return normalized;
  }

  throw new Error(lastErrorMessage);
};

// 2. 채팅방 생성 (POST)
export const createChatRoom = async (request: ChatRoomCreateRequest): Promise<any> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    console.error("채팅방 생성 서버 에러:", json);
    throw new Error(json.message || "채팅방 생성에 실패했습니다.");
  }

  return json.data;
};
// 3. 채팅방 유저 조회 (GET)
export const getChatRoomUsers = async (roomId: number): Promise<ChatRoomUserDto[]> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/rooms/users/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "참여자 조회 실패");
  }
  return json.data;
};

// 4. 채팅방 히스토리 조회 (GET)
export const getChatRoomHistory = async (
  roomId: number,
): Promise<ChatHistoryMessageDto[]> => {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/chat/rooms/history/${roomId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "채팅 내역 조회 실패");
  }
  return json.data;
};
