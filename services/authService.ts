// 인증 관련 서비스 (카카오 소셜 로그인)
// 토큰(accessToken, refreshToken)은 백엔드가 HttpOnly 쿠키로 관리하므로
// 프론트엔드에서 직접 읽거나 저장하지 않습니다.

import { getApiBaseUrl } from "./apiClient";

// OAuth2 콜백 파라미터 타입
// 백엔드는 토큰을 쿠키로 전달하고, URL에는 userId와 isNewUser만 포함됩니다.
export interface LoginCallbackData {
    isNewUser: boolean;
    userId: number;
}

// 카카오 로그인 URL 생성
// 백엔드 spring.custom.frontend-url 설정으로 콜백 처리
export const getKakaoLoginUrl = (): string => {
    return `${getApiBaseUrl()}/oauth2/authorization/kakao`;
};

// 구글 로그인 URL 생성
export const getGoogleLoginUrl = (): string => {
    return `${getApiBaseUrl()}/oauth2/authorization/google`;
};

// URL 쿼리 파라미터에서 OAuth2 콜백 데이터 추출
// 백엔드 전달 파라미터: userId, isNewUser
// accessToken, refreshToken은 HttpOnly 쿠키로 자동 저장됨
export const parseCallbackParams = (): LoginCallbackData | null => {
    const params = new URLSearchParams(window.location.search);

    const userId = params.get("userId");
    const isNewUser = params.get("isNewUser");

    if (!userId || isNewUser === null) {
        return null;
    }

    const parsedId = Number(userId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return null;
    }

    return {
        isNewUser: isNewUser === "true",
        userId: parsedId,
    };
};

// URL에서 에러 파라미터 추출
export const parseCallbackError = (): string | null => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error");
};

// URL 파라미터 정리 (콜백 파라미터 노출 방지)
export const cleanUpUrl = (): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
};

// 하위 호환 유지용 — 토큰은 HttpOnly 쿠키로 관리되므로 항상 null 반환
// postService 등 기존 코드와의 호환성을 위해 유지합니다.
export const getAccessToken = (): string | null => null;
