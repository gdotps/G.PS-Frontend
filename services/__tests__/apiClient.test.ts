import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, getApiBaseUrl } from "../apiClient";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeResponse(
  status: number,
  body: unknown,
  ok?: boolean
): Response {
  const isOk = ok ?? (status >= 200 && status < 300);
  return {
    status,
    ok: isOk,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response;
}

// ─────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(window, "dispatchEvent");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────
// getApiBaseUrl
// ─────────────────────────────────────────────
describe("getApiBaseUrl", () => {
  it("returns a non-empty string", () => {
    expect(typeof getApiBaseUrl()).toBe("string");
    expect(getApiBaseUrl().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────
// apiClient — credentials
// ─────────────────────────────────────────────
describe("apiClient — credentials:include", () => {
  it("attaches credentials:include on every request", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(200, { data: "ok" }));
    vi.stubGlobal("fetch", mockFetch);

    await apiClient("/api/v1/test");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
  });

  it("merges caller-supplied headers with Content-Type", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(200, {}));
    vi.stubGlobal("fetch", mockFetch);

    await apiClient("/api/v1/test", {
      headers: { "X-Custom": "value" },
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-Custom"]).toBe("value");
  });
});

// ─────────────────────────────────────────────
// apiClient — success path
// ─────────────────────────────────────────────
describe("apiClient — success", () => {
  it("returns parsed JSON when response is 2xx", async () => {
    const payload = { id: 1, name: "test" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeResponse(200, payload)));

    const result = await apiClient<typeof payload>("/api/v1/resource");
    expect(result).toEqual(payload);
  });

  it("passes method and body from options through to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(200, {}));
    vi.stubGlobal("fetch", mockFetch);

    await apiClient("/api/v1/resource", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ key: "value" }));
  });
});

// ─────────────────────────────────────────────
// apiClient — 401 → refresh → retry
// ─────────────────────────────────────────────
describe("apiClient — 401 handling", () => {
  it("calls POST /api/v1/auth/refresh after a 401", async () => {
    const mockFetch = vi.fn()
      // First call: original request → 401
      .mockResolvedValueOnce(makeResponse(401, "Unauthorized", false))
      // Second call: refresh → 200
      .mockResolvedValueOnce(makeResponse(200, null))
      // Third call: retry of original → 200 with data
      .mockResolvedValueOnce(makeResponse(200, { retried: true }));

    vi.stubGlobal("fetch", mockFetch);

    const result = await apiClient<{ retried: boolean }>("/api/v1/protected");

    // fetch should be called 3 times total
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Second call must be the refresh endpoint
    const [refreshUrl, refreshInit] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(refreshUrl).toContain("/api/v1/auth/refresh");
    expect(refreshInit.method).toBe("POST");
    expect(refreshInit.credentials).toBe("include");

    // Third call retries the original path
    const [retryUrl] = mockFetch.mock.calls[2] as [string, RequestInit];
    expect(retryUrl).toContain("/api/v1/protected");

    expect(result).toEqual({ retried: true });
  });

  it("dispatches auth:logout and throws when refresh fails", async () => {
    const mockFetch = vi.fn()
      // Original request → 401
      .mockResolvedValueOnce(makeResponse(401, "Unauthorized", false))
      // Refresh → non-ok response
      .mockResolvedValueOnce(makeResponse(401, "Refresh failed", false));

    vi.stubGlobal("fetch", mockFetch);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(apiClient("/api/v1/protected")).rejects.toThrow();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("auth:logout");
  });

  it("dispatches auth:logout and throws when refresh throws a network error", async () => {
    const mockFetch = vi.fn()
      // Original request → 401
      .mockResolvedValueOnce(makeResponse(401, "Unauthorized", false))
      // Refresh → network error
      .mockRejectedValueOnce(new Error("Network error"));

    vi.stubGlobal("fetch", mockFetch);
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(apiClient("/api/v1/protected")).rejects.toThrow();

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("auth:logout");
  });
});

// ─────────────────────────────────────────────
// apiClient — non-401 errors
// ─────────────────────────────────────────────
describe("apiClient — non-401 errors", () => {
  it("throws with status code message on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(404, "Not Found", false))
    );

    await expect(apiClient("/api/v1/missing")).rejects.toThrow("404");
  });

  it("throws with status code message on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(500, "Server Error", false))
    );

    await expect(apiClient("/api/v1/broken")).rejects.toThrow("500");
  });

  it("does NOT dispatch auth:logout on non-401 errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse(403, "Forbidden", false))
    );
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await expect(apiClient("/api/v1/forbidden")).rejects.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("does NOT retry on non-401 errors", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(503, "Unavailable", false));
    vi.stubGlobal("fetch", mockFetch);

    await expect(apiClient("/api/v1/down")).rejects.toThrow();
    // Only the original call — no refresh, no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────
// apiClient — URL construction
// ─────────────────────────────────────────────
describe("apiClient — URL construction", () => {
  it("prepends the API base URL to the path", async () => {
    const mockFetch = vi.fn().mockResolvedValue(makeResponse(200, {}));
    vi.stubGlobal("fetch", mockFetch);

    await apiClient("/api/v1/something");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toMatch(/^https?:\/\//);
    expect(url).toContain("/api/v1/something");
  });
});
