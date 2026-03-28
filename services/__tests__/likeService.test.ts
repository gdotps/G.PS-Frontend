import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { toggleLike } from "../likeService";

vi.mock("../apiClient", () => ({
  apiClient: vi.fn(),
  getApiBaseUrl: vi.fn(() => "http://localhost:8080"),
}));

import { apiClient } from "../apiClient";
const mockApiClient = vi.mocked(apiClient);

beforeEach(() => {
  mockApiClient.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────
// toggleLike
// ─────────────────────────────────────────────
describe("toggleLike", () => {
  it("calls POST /api/v1/likes with targetId in the request body", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { isLiked: true } });

    await toggleLike(12345);

    expect(mockApiClient).toHaveBeenCalledTimes(1);
    const [path, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/v1/likes");
    expect(options.method).toBe("POST");
    expect(options.body).toBe(JSON.stringify({ targetId: 12345 }));
  });

  it("returns isLiked: true when server toggles on", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { isLiked: true } });

    const result = await toggleLike(1);

    expect(result.isLiked).toBe(true);
  });

  it("returns isLiked: false when server toggles off", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { isLiked: false } });

    const result = await toggleLike(1);

    expect(result.isLiked).toBe(false);
  });

  it("sends the correct targetId for different post IDs", async () => {
    mockApiClient.mockResolvedValueOnce({ success: true, data: { isLiked: true } });

    await toggleLike(99);

    const [, options] = mockApiClient.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.targetId).toBe(99);
  });

  it("propagates errors thrown by apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("API 오류 500"));

    await expect(toggleLike(1)).rejects.toThrow("API 오류 500");
  });
});
