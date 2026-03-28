import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getKakaoLoginUrl,
  getGoogleLoginUrl,
  parseCallbackParams,
  parseCallbackError,
  cleanUpUrl,
  getAccessToken,
} from "../authService";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function setLocationSearch(search: string) {
  // jsdom lets us redefine window.location properties via Object.defineProperty
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      search,
      pathname: "/",
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────
// getKakaoLoginUrl
// ─────────────────────────────────────────────
describe("getKakaoLoginUrl", () => {
  it("returns a URL ending with /oauth2/authorization/kakao", () => {
    const url = getKakaoLoginUrl();
    expect(url).toMatch(/\/oauth2\/authorization\/kakao$/);
  });

  it("returns a full URL starting with http(s)", () => {
    const url = getKakaoLoginUrl();
    expect(url).toMatch(/^https?:\/\//);
  });
});

// ─────────────────────────────────────────────
// getGoogleLoginUrl
// ─────────────────────────────────────────────
describe("getGoogleLoginUrl", () => {
  it("returns a URL ending with /oauth2/authorization/google", () => {
    const url = getGoogleLoginUrl();
    expect(url).toMatch(/\/oauth2\/authorization\/google$/);
  });

  it("returns a full URL starting with http(s)", () => {
    const url = getGoogleLoginUrl();
    expect(url).toMatch(/^https?:\/\//);
  });

  it("returns a different URL from kakao login URL", () => {
    const googleUrl = getGoogleLoginUrl();
    const kakaoUrl = getKakaoLoginUrl();
    expect(googleUrl).not.toBe(kakaoUrl);
  });
});

// ─────────────────────────────────────────────
// parseCallbackParams
// ─────────────────────────────────────────────
describe("parseCallbackParams", () => {
  it("returns { userId, isNewUser, isRejoin } when both params are present", () => {
    setLocationSearch("?userId=42&isNewUser=false");

    const result = parseCallbackParams();
    expect(result).toEqual({ userId: 42, isNewUser: false, isRejoin: false });
  });

  it("parses isNewUser=true correctly", () => {
    setLocationSearch("?userId=7&isNewUser=true");

    const result = parseCallbackParams();
    expect(result).not.toBeNull();
    expect(result!.isNewUser).toBe(true);
    expect(result!.userId).toBe(7);
  });

  it("returns null when userId is missing", () => {
    setLocationSearch("?isNewUser=false");

    expect(parseCallbackParams()).toBeNull();
  });

  it("returns null when isNewUser is missing", () => {
    setLocationSearch("?userId=10");

    expect(parseCallbackParams()).toBeNull();
  });

  it("returns null when search string is empty", () => {
    setLocationSearch("");

    expect(parseCallbackParams()).toBeNull();
  });

  it("parses userId as a number (not string)", () => {
    setLocationSearch("?userId=99&isNewUser=false");

    const result = parseCallbackParams();
    expect(typeof result!.userId).toBe("number");
    expect(result!.userId).toBe(99);
  });
});

// ─────────────────────────────────────────────
// parseCallbackError
// ─────────────────────────────────────────────
describe("parseCallbackError", () => {
  it("returns the error string when ?error= is present", () => {
    setLocationSearch("?error=access_denied");

    expect(parseCallbackError()).toBe("access_denied");
  });

  it("returns the error string for multi-word errors", () => {
    setLocationSearch("?error=server_error_occurred");

    expect(parseCallbackError()).toBe("server_error_occurred");
  });

  it("returns null when no error param is in the URL", () => {
    setLocationSearch("?userId=5&isNewUser=true");

    expect(parseCallbackError()).toBeNull();
  });

  it("returns null when search string is empty", () => {
    setLocationSearch("");

    expect(parseCallbackError()).toBeNull();
  });
});

// ─────────────────────────────────────────────
// cleanUpUrl
// ─────────────────────────────────────────────
describe("cleanUpUrl", () => {
  it("calls window.history.replaceState with pathname only (no query string)", () => {
    setLocationSearch("?userId=5&isNewUser=true");

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    cleanUpUrl();

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    const [, , url] = replaceStateSpy.mock.calls[0];
    expect(url).toBe(window.location.pathname);
    expect(url).not.toContain("?");
  });

  it("replaceState is called even when there is no query string", () => {
    setLocationSearch("");

    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    cleanUpUrl();

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────
// getAccessToken (stub — backward compat)
// ─────────────────────────────────────────────
describe("getAccessToken", () => {
  it("always returns null", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("is a stable stub — returns null on repeated calls", () => {
    expect(getAccessToken()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
