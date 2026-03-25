// 인증 관련 서비스 (카카오 소셜 로그인)

export const API_BASE_URL = "http://localhost:8080";

// 로그인 응답 타입
export interface LoginResponse {
    isNewUser: boolean;
    userId: number;
}

// 카카오 로그인 URL 생성
// 백엔드가 spring.custom.frontend-url 설정값으로 리다이렉트
export const getKakaoLoginUrl = (): string => {
    return `${API_BASE_URL}/oauth2/authorization/kakao`;
};

// 구글 로그인 URL 생성
export const getGoogleLoginUrl = (): string => {
    return `${API_BASE_URL}/oauth2/authorization/google`;
};

// URL 쿼리 파라미터에서 로그인 응답 데이터 추출
// 백엔드 전달 파라미터: userId, isNewUser
// accessToken, refreshToken은 HttpOnly 쿠키로 자동 저장됨
export const parseCallbackParams = (): LoginResponse | null => {
    const params = new URLSearchParams(window.location.search);

    const userId = params.get("userId");
    const isNewUser = params.get("isNewUser");

    if (!userId || isNewUser === null) {
        return null;
    }

    return {
        isNewUser: isNewUser === "true",
        userId: Number(userId),
    };
};

// URL에서 에러 파라미터 추출
export const parseCallbackError = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
};

// URL 파라미터 정리 (토큰 정보 노출 방지)
export const cleanUpUrl = (): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
};

// ────────────────────────────────────────────────────────────────────────────
// 로그아웃
// ────────────────────────────────────────────────────────────────────────────

// POST /api/v1/users/logout
// accessToken + refreshToken은 HttpOnly 쿠키로 자동 전송
// 성공 시 백엔드가 쿠키 만료(MaxAge=0) 처리
export const logout = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/logout`, {
            method: "POST",
            credentials: "include",
        });
        return response.ok;
    } catch {
        return false;
    }
};

// ────────────────────────────────────────────────────────────────────────────
// AccessToken 재발급
// ────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/refresh
// refreshToken은 HttpOnly 쿠키로 자동 전송되므로 body 불필요
// 성공 시 백엔드가 새 accessToken + refreshToken을 Set-Cookie로 갱신
export const refreshAccessToken = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        return response.ok;
    } catch {
        return false;
    }
};
