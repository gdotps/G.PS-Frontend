/// <reference types="vite/client" />
// 중앙 집중식 API 클라이언트
// - credentials: 'include' 로 HttpOnly 쿠키(accessToken, refreshToken) 자동 전송
// - 401 응답 시 토큰 갱신 후 1회 재시도
// - 토큰 갱신 실패 시 auth:logout 이벤트 발생

const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8080";

export const getApiBaseUrl = (): string => API_BASE_URL;

type RefreshResult = "success" | "expired" | "error";

const doRefresh = async (): Promise<RefreshResult> => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (res.ok) return "success";
        const body = await res.json().catch(() => ({})) as { code?: string };
        if (body?.code === "REFRESH_TOKEN_EXPIRED") return "expired";
        return "error";
    } catch {
        return "error";
    }
};

export const apiClient = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = `${API_BASE_URL}${path}`;
    const init: RequestInit = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    let response = await fetch(url, init);

    if (response.status === 401) {
        const refreshResult = await doRefresh();
        if (refreshResult === "success") {
            response = await fetch(url, init);
        } else {
            window.dispatchEvent(new CustomEvent("auth:logout"));
            const message =
                refreshResult === "expired"
                    ? "RefreshToken이 만료되었습니다. 다시 로그인해 주세요."
                    : "세션이 만료되었습니다. 다시 로그인해 주세요.";
            throw new Error(message);
        }
    }

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 오류 ${response.status}: ${errText}`);
    }

    return response.json() as Promise<T>;
};
