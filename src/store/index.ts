import { create } from 'zustand';
import { SessionUser, PermissionSlip } from '@/types';

interface AuthStore {
    user: SessionUser | null;
    isLoading: boolean;
    setUser: (user: SessionUser | null) => void;
    setLoading: (loading: boolean) => void;
    clearUser: () => void;
    // 로컬 스토리지에서 사용자 정보 로드
    loadUserFromStorage: () => void;
    // 로컬 스토리지에 사용자 정보 저장
    saveUserToStorage: (user: SessionUser | null) => void;
}

interface PermissionSlipStore {
    permissionSlips: PermissionSlip[];
    isLoading: boolean;
    setPermissionSlips: (slips: PermissionSlip[]) => void;
    addPermissionSlip: (slip: PermissionSlip) => void;
    updatePermissionSlip: (id: string, updates: Partial<PermissionSlip>) => void;
    setLoading: (loading: boolean) => void;
}

// 로컬 스토리지 유틸리티 함수
const getStorageItem = (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

const setStorageItem = (key: string, value: unknown) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // 스토리지 에러 무시
    }
};

const removeStorageItem = (key: string) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(key);
    } catch {
        // 스토리지 에러 무시
    }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    isLoading: false,

    setUser: (user) => {
        // 같은 사용자가 다시 설정되는 것을 방지
        const currentUser = get().user;
        if (currentUser && user && currentUser.email === user.email) {
            return;
        }

        set({ user });
        get().saveUserToStorage(user);
    },

    setLoading: (isLoading) => set({ isLoading }),

    clearUser: () => {
        set({ user: null });
        removeStorageItem('auth-user');
        removeStorageItem('auth-timestamp');
    },

    loadUserFromStorage: () => {
        const storedUser = getStorageItem('auth-user');
        const timestamp = getStorageItem('auth-timestamp');

        if (storedUser && timestamp) {
            // 30일 체크 (30 * 24 * 60 * 60 * 1000)
            const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
            const now = Date.now();

            if (now - timestamp < THIRTY_DAYS) {
                set({ user: storedUser });
                console.log('📦 로컬 스토리지에서 사용자 정보 복원');
            } else {
                // 만료된 데이터 제거
                removeStorageItem('auth-user');
                removeStorageItem('auth-timestamp');
                console.log('🗑️ 만료된 사용자 정보 삭제');
            }
        }
    },

    saveUserToStorage: (user) => {
        if (user) {
            // 기존 데이터와 같은지 확인
            const existingUser = getStorageItem('auth-user');
            if (existingUser && existingUser.email === user.email) {
                return; // 같은 데이터면 저장하지 않음
            }

            setStorageItem('auth-user', user);
            setStorageItem('auth-timestamp', Date.now());
        } else {
            removeStorageItem('auth-user');
            removeStorageItem('auth-timestamp');
        }
    },
}));

export const usePermissionSlipStore = create<PermissionSlipStore>((set) => ({
    permissionSlips: [],
    isLoading: false,

    setPermissionSlips: (permissionSlips) => set({ permissionSlips }),

    addPermissionSlip: (slip) => set((state) => ({
        permissionSlips: [...state.permissionSlips, slip]
    })),

    updatePermissionSlip: (id, updates) => set((state) => ({
        permissionSlips: state.permissionSlips.map(slip =>
            slip.id === id ? { ...slip, ...updates } : slip
        )
    })),

    setLoading: (isLoading) => set({ isLoading }),
}));