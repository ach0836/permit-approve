import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessionUser, PermissionSlip } from '@/types';

interface AuthStore {
    user: SessionUser | null;
    isLoading: boolean;
    lastLoginTime: number | null;
    hydrated: boolean;
    setUser: (user: SessionUser | null) => void;
    setLoading: (loading: boolean) => void;
    clearUser: () => void;
    updateLastLoginTime: () => void;
    isSessionValid: () => boolean;
    setHydrated: () => void;
}

interface PermissionSlipStore {
    permissionSlips: PermissionSlip[];
    isLoading: boolean;
    setPermissionSlips: (slips: PermissionSlip[]) => void;
    addPermissionSlip: (slip: PermissionSlip) => void;
    updatePermissionSlip: (id: string, updates: Partial<PermissionSlip>) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            lastLoginTime: null,
            hydrated: false,
            setUser: (user) => set({
                user,
                lastLoginTime: user ? Date.now() : null
            }),
            setLoading: (isLoading) => set({ isLoading }),
            clearUser: () => set({
                user: null,
                lastLoginTime: null
            }),
            updateLastLoginTime: () => set({ lastLoginTime: Date.now() }),
            isSessionValid: () => {
                const { lastLoginTime } = get();
                if (!lastLoginTime) return false;

                // 30일 = 30 * 24 * 60 * 60 * 1000 밀리초
                const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
                return Date.now() - lastLoginTime < THIRTY_DAYS;
            },
            setHydrated: () => set({ hydrated: true }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => {
                // 브라우저 환경에서만 localStorage 사용
                if (typeof window !== 'undefined') {
                    return localStorage;
                }
                // 서버 사이드에서는 더미 스토리지 사용
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
            partialize: (state) => ({
                user: state.user,
                lastLoginTime: state.lastLoginTime,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
); export const usePermissionSlipStore = create<PermissionSlipStore>((set) => ({
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
