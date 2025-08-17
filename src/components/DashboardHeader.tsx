'use client';

import { useAuthStore } from '@/store';
import { UserRole } from '@/types';
import { FaUser, FaSignOutAlt, FaClipboardList, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';
import { signOut } from 'next-auth/react';
import NotificationToggle from './NotificationToggle';

const getRoleIcon = (role: UserRole) => {
    switch (role) {
        case 'student':
            return <FaUser className="w-3 h-3" />;
        case 'teacher':
            return <FaChalkboardTeacher className="w-3 h-3" />;
        case 'admin':
            return <FaUserShield className="w-3 h-3" />;
        default:
            return <FaUser className="w-3 h-3" />;
    }
};

const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
        case 'student':
            return 'bg-blue-400 text-white';
        case 'teacher':
            return 'bg-black text-white';
        case 'admin':
            return 'bg-gray-800 text-white';
        default:
            return 'bg-gray-100 text-black';
    }
};

const getRoleText = (role: UserRole) => {
    switch (role) {
        case 'student':
            return '학생';
        case 'teacher':
            return '교사';
        case 'admin':
            return '관리자';
        default:
            return '알 수 없음';
    }
};

export default function DashboardHeader() {
    const { user, clearUser } = useAuthStore();

    const handleLogout = async () => {
        try {
            // Zustand 스토어 정리
            clearUser();

            // 로컬 스토리지 완전 정리
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-user');
                localStorage.removeItem('auth-timestamp');
                // NextAuth 관련 쿠키/스토리지도 정리
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
            }

            // NextAuth 로그아웃
            await signOut({
                callbackUrl: '/',
                redirect: true
            });
        } catch (error) {
            console.error('로그아웃 중 오류:', error);
            // 에러가 발생해도 홈으로 리다이렉트
            window.location.href = '/';
        }
    }; if (!user) return null;

    return (
        <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <FaClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl sm:text-2xl font-bold text-black">디지털 허가원 시스템</h1>
                            <p className="text-xs sm:text-sm text-gray-600">Digital Permission System</p>
                        </div>
                        <div className="sm:hidden">
                            <h1 className="text-lg font-bold text-black">허가원</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* 알림 토글 */}
                        <NotificationToggle className="hidden sm:flex" />

                        {/* 모바일에서는 사용자 정보 간소화 */}
                        <div className="hidden sm:flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-3 border border-gray-200">
                            {user.image && (
                                <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100">
                                    <img src={user.image} alt={user.name || '사용자'} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="flex flex-col">
                                <span className="font-bold text-base text-black">{user.name}</span>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                                    {getRoleIcon(user.role)}
                                    {getRoleText(user.role)}
                                </div>
                            </div>
                        </div>

                        {/* 모바일용 사용자 정보 */}
                        <div className="sm:hidden flex items-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-black truncate max-w-20">{user.name}</span>
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                    {getRoleIcon(user.role)}
                                    {getRoleText(user.role)}
                                </div>
                            </div>
                        </div>

                        {/* 모바일용 알림 토글 */}
                        <NotificationToggle className="sm:hidden" isMobile={true} />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gray-100 text-black rounded-xl sm:rounded-2xl hover:bg-black hover:text-white transition-colors font-medium text-sm sm:text-base"
                        >
                            <FaSignOutAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">로그아웃</span>
                            <span className="sm:hidden">로그아웃</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
