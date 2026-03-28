import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCurrentUser, updateUserProfile, logoutUser, getUserInfo, withdrawUser, updateNotificationSetting, getMyApplications } from "../userService";
import type { Post, User } from "../../types";

// ─────────────────────────────────────────────
// We mock the apiClient module so userService tests
// are pure unit tests — no actual HTTP calls.
// ─────────────────────────────────────────────
vi.mock("../apiClient", () => ({
  apiClient: vi.fn(),
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
}));

import { apiClient } from "../apiClient";
const mockApiClient = vi.mocked(apiClient);

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const MOCK_USER = {
  userId: 1,
  nickname: "TestUser",
  profileUrl: "https://example.com/avatar.png",
  introduction: "Hello",
  notificationEnabled: true,
};

// ─────────────────────────────────────────────
// Setup / teardown
// ─────────────────────────────────────────────
beforeEach(() => {
  mockApiClient.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────
// fetchCurrentUser
// ─────────────────────────────────────────────
describe("fetchCurrentUser", () => {
  it("calls GET /api/v1/users/me and returns response.data", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: MOCK_USER });

    const result = await fetchCurrentUser();

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit | undefined];
    expect(path).toBe("/api/v1/users/me");
    // Default GET — no explicit method needed
    expect(options?.method).toBeUndefined();

    expect(result).toEqual(MOCK_USER);
  });

  it("returns null when apiClient throws", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("Network failure"));

    const result = await fetchCurrentUser();
    expect(result).toBeNull();
  });

  it("returns null when apiClient throws a non-Error rejection", async () => {
    mockApiClient.mockRejectedValueOnce("string rejection");

    const result = await fetchCurrentUser();
    expect(result).toBeNull();
  });

  it("returns null on 401 (apiClient bubbles up the error)", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("세션이 만료되었습니다. 다시 로그인해 주세요."));

    const result = await fetchCurrentUser();
    expect(result).toBeNull();
  });

  it("returns the data field from the API envelope", async () => {
    const user = { ...MOCK_USER, nickname: "AnotherUser" };
    mockApiClient.mockResolvedValueOnce({ success: true, data: user });

    const result = await fetchCurrentUser();
    expect(result?.nickname).toBe("AnotherUser");
  });
});

// ─────────────────────────────────────────────
// updateUserProfile
// ─────────────────────────────────────────────
describe("updateUserProfile", () => {
  it("calls PATCH /api/v1/users/me with nickname and introduction", async () => {
    const updated = { ...MOCK_USER, nickname: "NewNick", introduction: "Updated" };
    mockApiClient.mockResolvedValueOnce({ success: true, data: updated });

    const result = await updateUserProfile({
      nickname: "NewNick",
      introduction: "Updated",
    });

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/users/me");
    expect(options.method).toBe("PATCH");
    expect(options.body).toBe(JSON.stringify({ nickname: "NewNick", introduction: "Updated" }));
  });

  it("returns response.data (the updated user)", async () => {
    const updated = { ...MOCK_USER, nickname: "Updated" };
    mockApiClient.mockResolvedValueOnce({ success: true, data: updated });

    const result = await updateUserProfile({ nickname: "Updated", introduction: "" });
    expect(result).toEqual(updated);
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("API 오류 422: Validation error"));

    await expect(
      updateUserProfile({ nickname: "", introduction: "" })
    ).rejects.toThrow();
  });

  it("sends empty string values when provided", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: MOCK_USER });

    await updateUserProfile({ nickname: "", introduction: "" });

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.nickname).toBe("");
    expect(body.introduction).toBe("");
  });

  // ── Partial update tests ──────────────────────────────────────────────────

  it("sends only nickname when introduction is omitted", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { ...MOCK_USER, nickname: "OnlyNick" } });

    await updateUserProfile({ nickname: "OnlyNick" });

    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/users/me");
    expect(options.method).toBe("PATCH");
    const body = JSON.parse(options.body as string);
    expect(body.nickname).toBe("OnlyNick");
    expect(body).not.toHaveProperty("introduction");
  });

  it("sends only introduction when nickname is omitted", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { ...MOCK_USER, introduction: "Only intro" } });

    await updateUserProfile({ introduction: "Only intro" });

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.introduction).toBe("Only intro");
    expect(body).not.toHaveProperty("nickname");
  });

  it("sends both fields when both are provided", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: MOCK_USER });

    await updateUserProfile({ nickname: "Nick", introduction: "Intro" });

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.nickname).toBe("Nick");
    expect(body.introduction).toBe("Intro");
  });

  it("sends an empty object when no fields are provided", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: MOCK_USER });

    await updateUserProfile({});

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({});
  });
});

// ─────────────────────────────────────────────
// logoutUser
// ─────────────────────────────────────────────
describe("logoutUser", () => {
  it("calls POST /api/v1/auth/logout", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: null });

    await logoutUser();

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/auth/logout");
    expect(options.method).toBe("POST");
  });

  it("resolves void (returns nothing) on success", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: null });

    const result = await logoutUser();
    expect(result).toBeUndefined();
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("세션이 만료되었습니다. 다시 로그인해 주세요."));

    await expect(logoutUser()).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────
// withdrawUser
// ─────────────────────────────────────────────
describe("withdrawUser", () => {
  const MOCK_WITHDRAW_DATA = {
    userId: 3,
    deleted_at: "2026-02-15 00:00:00",
    is_deleted: true,
  };
  const MOCK_MESSAGE = "회원탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.";

  it("calls DELETE /api/v1/users/withdraw", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: MOCK_MESSAGE,
      data: MOCK_WITHDRAW_DATA,
    });

    await withdrawUser();

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/users/withdraw");
    expect(options.method).toBe("DELETE");
  });

  it("returns { message, data } on success", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: MOCK_MESSAGE,
      data: MOCK_WITHDRAW_DATA,
    });

    const result = await withdrawUser();

    expect(result.message).toBe(MOCK_MESSAGE);
    expect(result.data).toEqual(MOCK_WITHDRAW_DATA);
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("API 오류 401"));

    await expect(withdrawUser()).rejects.toThrow("API 오류 401");
  });
});

// ─────────────────────────────────────────────
// getUserInfo (pure utility — no apiClient)
// ─────────────────────────────────────────────
describe("getUserInfo", () => {
  const CURRENT_USER_ID = 1;
  const mockCurrentUser: User = {
    userId: CURRENT_USER_ID,
    nickname: "테스트유저",
    profileUrl: "https://example.com/me.png",
    notificationEnabled: true,
  };

  const makePost = (overrides: Partial<Post> = {}): Post => ({
    id: 100,
    authorId: 2,
    authorName: "Author",
    authorAvatar: "https://example.com/avatar.png",
    title: "Post",
    description: "desc",
    category: "ETC",
    meetingType: "OFFLINE",
    location: "Seoul",
    distance: "1km",
    maxMembers: 4,
    currentMembers: 1,
    time: "now",
    tags: [],
    createdAt: Date.now(),
    comments: [],
    applicants: [],
    ...overrides,
  });

  it("returns currentUser when userId matches the current user", () => {
    const result = getUserInfo(CURRENT_USER_ID, [], mockCurrentUser);
    expect(result.userId).toBe(CURRENT_USER_ID);
    expect(result.nickname).toBe("테스트유저");
  });

  it("returns author info when userId matches a post authorId", () => {
    const post = makePost({ authorId: 42, authorName: "PostAuthor", authorAvatar: "https://example.com/pa.png" });
    const result = getUserInfo(42, [post], mockCurrentUser);

    expect(result.userId).toBe(42);
    expect(result.nickname).toBe("PostAuthor");
    expect(result.profileUrl).toBe("https://example.com/pa.png");
  });

  it("returns applicant info when userId is found in post applicants", () => {
    const applicant: User = {
      userId: 77,
      nickname: "Applicant",
      profileUrl: "https://example.com/ap.png",
      notificationEnabled: false,
    };
    const post = makePost({ authorId: 99, applicants: [applicant] });
    const result = getUserInfo(77, [post], mockCurrentUser);

    expect(result.userId).toBe(77);
    expect(result.nickname).toBe("Applicant");
  });

  it("returns a fallback user when userId is not found anywhere", () => {
    const result = getUserInfo(9999, [makePost({ authorId: 2 })], mockCurrentUser);

    expect(result.userId).toBe(9999);
    expect(result.nickname).toBe("알 수 없음");
  });

  it("returns fallback user when posts array is empty", () => {
    const result = getUserInfo(9999, [], mockCurrentUser);
    expect(result.nickname).toBe("알 수 없음");
  });

  it("skips posts without applicants array when searching for applicant", () => {
    const post = makePost({ authorId: 55, applicants: undefined });
    const result = getUserInfo(77, [post], mockCurrentUser);

    expect(result.nickname).toBe("알 수 없음");
  });
});

// ─────────────────────────────────────────────
// updateNotificationSetting
// ─────────────────────────────────────────────
describe("updateNotificationSetting", () => {
  it("calls PATCH /api/v1/users/me/notifications with correct endpoint and method", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: "알림 설정이 변경되었습니다.",
      code: "USER_SUCCESS",
      data: { notificationEnabled: true },
    });

    await updateNotificationSetting(true);

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/users/me/notifications");
    expect(options.method).toBe("PATCH");
  });

  it("returns { notificationEnabled: true } when called with true", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: "알림 설정이 변경되었습니다.",
      code: "USER_SUCCESS",
      data: { notificationEnabled: true },
    });

    const result = await updateNotificationSetting(true);

    expect(result).toEqual({ notificationEnabled: true });
  });

  it("returns { notificationEnabled: false } when called with false", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: "알림 설정이 변경되었습니다.",
      code: "USER_SUCCESS",
      data: { notificationEnabled: false },
    });

    const result = await updateNotificationSetting(false);

    expect(result).toEqual({ notificationEnabled: false });
  });

  it("sends the correct request body", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      message: "알림 설정이 변경되었습니다.",
      code: "USER_SUCCESS",
      data: { notificationEnabled: false },
    });

    await updateNotificationSetting(false);

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ notificationEnabled: false });
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("API 오류 500"));

    await expect(updateNotificationSetting(true)).rejects.toThrow("API 오류 500");
  });
});

// ─────────────────────────────────────────────
// getMyApplications
// ─────────────────────────────────────────────
describe("getMyApplications", () => {
  const MOCK_APPLICATION_ITEM = {
    applicationId: 1,
    postId: 10,
    title: "주말 축구 모임",
    category: "SPORTS",
    status: "PENDING" as const,
    meetingTime: "2026-04-01T10:00:00",
    locationName: "서울 중구",
    postImageUrl: "https://example.com/img.png",
  };

  const MOCK_PAGEABLE = {
    pageNumber: 0,
    pageSize: 10,
  };

  it("calls GET /api/v1/users/me/applications with default params (page=0, size=10)", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        content: [MOCK_APPLICATION_ITEM],
        pageable: MOCK_PAGEABLE,
        last: false,
      },
    });

    await getMyApplications();

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit | undefined];
    expect(path).toBe("/api/v1/users/me/applications?page=0&size=10");
    expect(options?.method).toBeUndefined();
  });

  it("calls GET /api/v1/users/me/applications with custom page=1, size=5", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        content: [],
        pageable: { pageNumber: 1, pageSize: 5 },
        last: true,
      },
    });

    await getMyApplications(1, 5);

    const [path] = mockApiClient.mock.calls[0] as [string, RequestInit | undefined];
    expect(path).toBe("/api/v1/users/me/applications?page=1&size=5");
  });

  it("returns content array, pageable, and last flag correctly", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        content: [MOCK_APPLICATION_ITEM],
        pageable: MOCK_PAGEABLE,
        last: false,
      },
    });

    const result = await getMyApplications();

    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toEqual(MOCK_APPLICATION_ITEM);
    expect(result.pageable).toEqual(MOCK_PAGEABLE);
    expect(result.last).toBe(false);
  });

  it("handles empty content array with last=true", async () => {
    mockApiClient.mockResolvedValueOnce({
      success: true,
      data: {
        content: [],
        pageable: { pageNumber: 0, pageSize: 10 },
        last: true,
      },
    });

    const result = await getMyApplications();

    expect(result.content).toEqual([]);
    expect(result.last).toBe(true);
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("API 오류 401"));

    await expect(getMyApplications()).rejects.toThrow("API 오류 401");
  });
});
