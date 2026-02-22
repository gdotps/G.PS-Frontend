// 인증 관련 서비스 (카카오 소셜 로그인)

const API_BASE_URL = "http://localhost:8080";

// 로그인 응답 타입
export interface LoginResponse {
    accessToken: string;
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
// 백엔드 전달 파라미터: accessToken, userId, isNewUser
// refreshToken은 HttpOnly 쿠키로 자동 저장됨
export const parseCallbackParams = (): LoginResponse | null => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get("accessToken");
    const userId = params.get("userId");
    const isNewUser = params.get("isNewUser");

    if (!accessToken || !userId || isNewUser === null) {
        return null;
    }

    return {
        accessToken,
        isNewUser: isNewUser === "true",
        userId: Number(userId),
    };
};

// URL에서 에러 파라미터 추출
export const parseCallbackError = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
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
