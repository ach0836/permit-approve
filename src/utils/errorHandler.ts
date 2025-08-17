// 에러 처리 유틸리티
export interface AppError {
    code: string;
    message: string;
    userMessage: string;
    details?: unknown;
}

export const createError = (
    code: string,
    message: string,
    userMessage: string,
    details?: unknown
): AppError => ({
    code,
    message,
    userMessage,
    details
});

// 미리 정의된 에러 코드들
export const ErrorCodes = {
    // FCM 관련
    FCM_NOT_SUPPORTED: 'FCM_NOT_SUPPORTED',
    FCM_PERMISSION_DENIED: 'FCM_PERMISSION_DENIED',
    FCM_TOKEN_FAILED: 'FCM_TOKEN_FAILED',
    FCM_INIT_FAILED: 'FCM_INIT_FAILED',

    // Auth 관련
    AUTH_INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
    AUTH_DOMAIN_RESTRICTED: 'AUTH_DOMAIN_RESTRICTED',
    AUTH_DB_ERROR: 'AUTH_DB_ERROR',

    // API 관련
    API_VALIDATION_ERROR: 'API_VALIDATION_ERROR',
    API_UNAUTHORIZED: 'API_UNAUTHORIZED',
    API_RATE_LIMITED: 'API_RATE_LIMITED',

    // 일반
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// 사용자 친화적 에러 메시지 매핑
export const getUserFriendlyMessage = (code: string): string => {
    const messages: Record<string, string> = {
        [ErrorCodes.FCM_NOT_SUPPORTED]: '이 브라우저는 알림 기능을 지원하지 않습니다.',
        [ErrorCodes.FCM_PERMISSION_DENIED]: '알림 권한이 차단되었습니다. 브라우저 설정에서 허용해주세요.',
        [ErrorCodes.FCM_TOKEN_FAILED]: '알림 설정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        [ErrorCodes.FCM_INIT_FAILED]: '알림 서비스 초기화에 실패했습니다.',

        [ErrorCodes.AUTH_INVALID_EMAIL]: '올바른 이메일 주소를 입력해주세요.',
        [ErrorCodes.AUTH_DOMAIN_RESTRICTED]: '허용되지 않은 도메인입니다. 관리자에게 문의하세요.',
        [ErrorCodes.AUTH_DB_ERROR]: '로그인 처리 중 오류가 발생했습니다.',

        [ErrorCodes.API_VALIDATION_ERROR]: '입력 정보를 확인해주세요.',
        [ErrorCodes.API_UNAUTHORIZED]: '로그인이 필요합니다.',
        [ErrorCodes.API_RATE_LIMITED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

        [ErrorCodes.NETWORK_ERROR]: '네트워크 연결을 확인해주세요.',
        [ErrorCodes.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.'
    };

    return messages[code] || messages[ErrorCodes.UNKNOWN_ERROR];
};

// 에러 리포팅 (개발 환경에서만)
export const reportError = (error: AppError): void => {
    if (process.env.NODE_ENV === 'development') {
        console.error('[Error Report]', {
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            details: error.details,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : 'server'
        });
    }

    // 프로덕션에서는 외부 에러 트래킹 서비스로 전송
    // 예: Sentry, LogRocket 등
};

export default {
    createError,
    ErrorCodes,
    getUserFriendlyMessage,
    reportError
};
