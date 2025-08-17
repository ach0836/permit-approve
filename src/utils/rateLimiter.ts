// 간단한 인메모리 Rate Limiter
interface RateLimitEntry {
    count: number;
    lastReset: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
    windowMs: number; // 시간 윈도우 (밀리초)
    maxRequests: number; // 최대 요청 수
}

export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    // 요청 허용 여부 확인
    checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const entry = rateLimitStore.get(identifier);

        // 새로운 엔트리이거나 윈도우가 리셋되었으면 초기화
        if (!entry || now - entry.lastReset > this.config.windowMs) {
            const newEntry: RateLimitEntry = {
                count: 1,
                lastReset: now
            };
            rateLimitStore.set(identifier, newEntry);

            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime: now + this.config.windowMs
            };
        }

        // 제한을 초과했는지 확인
        if (entry.count >= this.config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.lastReset + this.config.windowMs
            };
        }

        // 카운트 증가
        entry.count++;
        rateLimitStore.set(identifier, entry);

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.lastReset + this.config.windowMs
        };
    }

    // 정리 작업 (메모리 누수 방지)
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now - entry.lastReset > this.config.windowMs) {
                rateLimitStore.delete(key);
            }
        }
    }
}

// 미리 정의된 Rate Limiter 인스턴스들
export const notificationRateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 10 // 15분에 10회
});

export const authRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1분
    maxRequests: 5 // 1분에 5회
});

// 정리 작업을 주기적으로 실행
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        notificationRateLimiter.cleanup();
        authRateLimiter.cleanup();
    }, 5 * 60 * 1000); // 5분마다 정리
}

export default RateLimiter;
