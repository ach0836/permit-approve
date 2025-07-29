'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import DashboardHeader from '@/components/DashboardHeader';
import StudentDashboard from '@/components/StudentDashboard';
import TeacherDashboard from '@/components/TeacherDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Dashboard() {
    const router = useRouter();
    const { user, isLoading } = useAuthStore();

    useEffect(() => {
        // 로딩 중이 아니고 사용자가 없을 때만 리디렉션
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    // 로딩 중이거나 사용자가 없으면 로딩 화면 표시
    if (isLoading || !user) {
        return <LoadingSpinner />;
    }

    const renderDashboard = () => {
        switch (user.role) {
            case 'student':
                return <StudentDashboard />;
            case 'teacher':
                return <TeacherDashboard />;
            case 'admin':
                return <AdminDashboard />;
            default:
                return (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
                            <p className="text-gray-600">유효하지 않은 사용자 역할입니다.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <main className="py-6">
                {renderDashboard()}
            </main>
        </div>
    );
}
