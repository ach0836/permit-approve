// 환경에 따른 로그 유틸리티
export const logger = {
    log: (...args: unknown[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(...args);
        }
    },

    error: (...args: unknown[]) => {
        console.error(...args);
    },

    warn: (...args: unknown[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.warn(...args);
        }
    },

    debug: (...args: unknown[]) => {
        if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
            console.log('[DEBUG]', ...args);
        }
    },

    // FCM 전용 로거
    fcm: {
        log: (...args: unknown[]) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[FCM]', ...args);
            }
        },

        error: (...args: unknown[]) => {
            console.error('[FCM]', ...args);
        }
    },

    // Auth 전용 로거
    auth: {
        log: (...args: unknown[]) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth]', ...args);
            }
        },

        error: (...args: unknown[]) => {
            console.error('[Auth]', ...args);
        }
    }
};

export default logger;
