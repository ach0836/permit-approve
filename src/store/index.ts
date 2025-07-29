import { create } from 'zustand';
import { SessionUser, PermissionSlip } from '@/types';

interface AuthStore {
    user: SessionUser | null;
    isLoading: boolean;
    setUser: (user: SessionUser | null) => void;
    setLoading: (loading: boolean) => void;
    clearUser: () => void;
}

interface PermissionSlipStore {
    permissionSlips: PermissionSlip[];
    isLoading: boolean;
    setPermissionSlips: (slips: PermissionSlip[]) => void;
    addPermissionSlip: (slip: PermissionSlip) => void;
    updatePermissionSlip: (id: string, updates: Partial<PermissionSlip>) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: false,
    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),
    clearUser: () => set({ user: null }),
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
