/**
 * TDD tests for the profile loading feature wired into useAppLogic.
 *
 * Covers:
 *  - isProfileLoading is exported and starts as false
 *  - goToProfile switches view and triggers refreshCurrentUser
 *  - goToProfileEdit switches view and triggers refreshCurrentUser
 *  - refreshCurrentUser sets isProfileLoading=true then false
 *  - refreshCurrentUser updates currentUser when fetchCurrentUser returns data
 *  - refreshCurrentUser does NOT update currentUser when fetchCurrentUser returns null
 *  - refreshCurrentUser resets isProfileLoading to false even on error
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAppLogic } from "../useAppLogic";
import { ViewState } from "../../types";

// ─────────────────────────────────────────────
// Mock all service modules so no real HTTP calls are made
// ─────────────────────────────────────────────
vi.mock("../../services/userService", () => ({
  fetchCurrentUser: vi.fn(),
  logoutUser: vi.fn(),
  updateNotificationSetting: vi.fn(),
  updateUserProfile: vi.fn(),
  withdrawUser: vi.fn(),
  getUserInfo: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  cleanUpUrl: vi.fn(),
  parseCallbackError: vi.fn(() => null),
  parseCallbackParams: vi.fn(() => null),
}));

vi.mock("../../services/postService", () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
}));

import { fetchCurrentUser } from "../../services/userService";

const mockFetchCurrentUser = vi.mocked(fetchCurrentUser);

const MOCK_USER = {
  userId: 42,
  nickname: "FreshUser",
  profileUrl: "https://example.com/fresh.png",
  introduction: "I am fresh",
  notificationEnabled: true,
};

beforeEach(() => {
  mockFetchCurrentUser.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────
// isProfileLoading — initial state
// ─────────────────────────────────────────────
describe("isProfileLoading initial state", () => {
  it("is exported from useAppLogic and starts as false", () => {
    const { result } = renderHook(() => useAppLogic());
    expect(result.current.isProfileLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────
// goToProfile
// ─────────────────────────────────────────────
describe("goToProfile", () => {
  it("switches currentView to PROFILE immediately (optimistic navigation)", () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    act(() => {
      result.current.goToProfile();
    });

    expect(result.current.currentView).toBe(ViewState.PROFILE);
  });

  it("calls fetchCurrentUser after switching to PROFILE view", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfile();
    });

    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("sets isProfileLoading to false after fetchCurrentUser resolves", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfile();
    });

    expect(result.current.isProfileLoading).toBe(false);
  });

  it("updates currentUser when fetchCurrentUser returns a user", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfile();
    });

    expect(result.current.currentUser.userId).toBe(42);
    expect(result.current.currentUser.nickname).toBe("FreshUser");
  });

  it("does NOT update currentUser when fetchCurrentUser returns null", async () => {
    mockFetchCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAppLogic());
    const originalNickname = result.current.currentUser.nickname;

    await act(async () => {
      result.current.goToProfile();
    });

    // currentUser.nickname should remain unchanged
    expect(result.current.currentUser.nickname).toBe(originalNickname);
  });

  it("resets isProfileLoading to false even when fetchCurrentUser rejects", async () => {
    mockFetchCurrentUser.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfile();
    });

    expect(result.current.isProfileLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────
// goToProfileEdit
// ─────────────────────────────────────────────
describe("goToProfileEdit", () => {
  it("switches currentView to PROFILE_EDIT immediately (optimistic navigation)", () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    act(() => {
      result.current.goToProfileEdit();
    });

    expect(result.current.currentView).toBe(ViewState.PROFILE_EDIT);
  });

  it("calls fetchCurrentUser after switching to PROFILE_EDIT view", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfileEdit();
    });

    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1);
  });

  it("sets isProfileLoading to false after fetchCurrentUser resolves", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfileEdit();
    });

    expect(result.current.isProfileLoading).toBe(false);
  });

  it("updates currentUser when fetchCurrentUser returns a user", async () => {
    mockFetchCurrentUser.mockResolvedValue(MOCK_USER);

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfileEdit();
    });

    expect(result.current.currentUser.nickname).toBe("FreshUser");
  });

  it("does NOT update currentUser when fetchCurrentUser returns null", async () => {
    mockFetchCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAppLogic());
    const originalNickname = result.current.currentUser.nickname;

    await act(async () => {
      result.current.goToProfileEdit();
    });

    expect(result.current.currentUser.nickname).toBe(originalNickname);
  });

  it("resets isProfileLoading to false even when fetchCurrentUser rejects", async () => {
    mockFetchCurrentUser.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAppLogic());

    await act(async () => {
      result.current.goToProfileEdit();
    });

    expect(result.current.isProfileLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────
// refreshCurrentUser loading sequence
// ─────────────────────────────────────────────
describe("refreshCurrentUser loading sequence", () => {
  it("sets isProfileLoading to true during the fetch and back to false after", async () => {
    let resolvePromise!: (value: typeof MOCK_USER) => void;
    const controlledPromise = new Promise<typeof MOCK_USER>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchCurrentUser.mockReturnValueOnce(controlledPromise);

    const { result } = renderHook(() => useAppLogic());

    // Start the navigation (does not await — we want to inspect mid-flight state)
    act(() => {
      result.current.goToProfile();
    });

    // While the promise is pending, isProfileLoading should be true
    expect(result.current.isProfileLoading).toBe(true);

    // Resolve the promise and flush state updates
    await act(async () => {
      resolvePromise(MOCK_USER);
    });

    // After resolution, isProfileLoading should be false again
    expect(result.current.isProfileLoading).toBe(false);
  });
});
