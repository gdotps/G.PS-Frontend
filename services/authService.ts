// 인증 관련 서비스 (카카오 소셜 로그인)

const API_BASE_URL = "http://localhost:8080";

// 로그인 응답 타입
export interface LoginResponse {
    accessToken: string;
    isNewUser: boolean;
    userId: number;
}

const pickParam = (params: URLSearchParams, keys: string[]): string | null => {
    for (const key of keys) {
        const value = params.get(key);
        if (value !== null && value !== "") return value;
    }
    return null;
};

const getAllCallbackParams = (): URLSearchParams => {
    const merged = new URLSearchParams();

    const queryParams = new URLSearchParams(window.location.search);
    queryParams.forEach((value, key) => {
        merged.set(key, value);
    });

    const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
    if (hash) {
        const hashParams = new URLSearchParams(hash);
        hashParams.forEach((value, key) => {
            if (!merged.has(key)) merged.set(key, value);
        });
    }

    return merged;
};

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
// 백엔드 전달 파라미터: accessToken, userId, isNewUser
// refreshToken은 HttpOnly 쿠키로 자동 저장됨
export const parseCallbackParams = (): LoginResponse | null => {
    const params = getAllCallbackParams();

    const accessToken = pickParam(params, ["accessToken", "access_token", "token"]);
    const userIdRaw = pickParam(params, ["userId", "user_id", "id"]);
    const isNewUserRaw = pickParam(params, ["isNewUser", "is_new_user", "newUser"]);

    const userId = userIdRaw ? Number(userIdRaw) : NaN;
    const isNewUser = isNewUserRaw ? ["true", "1", "yes", "y"].includes(isNewUserRaw.toLowerCase()) : false;

    if (!accessToken || !Number.isFinite(userId)) {
        return null;
    }

    return {
        accessToken,
        isNewUser,
        userId,
    };
};

// URL에서 에러 파라미터 추출
export const parseCallbackError = (): string | null => {
    const params = getAllCallbackParams();
    return pickParam(params, ["error", "error_description"]);
};

// AccessToken 저장 (localStorage)
// RefreshToken은 백엔드가 HttpOnly 쿠키로 관리
export const saveAccessToken = (accessToken: string): void => {
    localStorage.setItem("accessToken", accessToken);
};

// 액세스 토큰 조회
export const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
};

// 토큰 삭제 (로그아웃 시)
export const clearTokens = (): void => {
    localStorage.removeItem("accessToken");
};

// URL 파라미터 정리 (토큰 정보 노출 방지)
export const cleanUpUrl = (): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
};
