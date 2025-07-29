'use client';

import { signIn } from 'next-auth/react';
import { FcGoogle } from 'react-icons/fc';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';

export default function LoginComponent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoading: authLoading } = useAuthStore();
    const router = useRouter();

    // 이미 로그인된 사용자는 대시보드로 리디렉션
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await signIn('google', {
                callbackUrl: '/dashboard',
                redirect: true
            });

            if (result?.error) {
                setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } catch {
            setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    // 인증 로딩 중일 때는 로딩 화면 표시
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4" role="main">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8" role="dialog" aria-labelledby="login-title" aria-describedby="login-description">
                    <div className="text-center mb-8">
                        <h1 id="login-title" className="text-3xl font-bold text-gray-900 mb-2">
                            디지털 허가원 시스템
                        </h1>
                        <p id="login-description" className="text-gray-600">
                            Google 계정으로 로그인하여 허가원 시스템을 이용하세요
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-lg p-4" role="region" aria-labelledby="features-title">
                            <h3 id="features-title" className="font-semibold text-gray-900 mb-3">시스템 기능</h3>
                            <ul className="space-y-2 text-sm text-gray-600" role="list">
                                <li className="flex items-center" role="listitem">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" aria-hidden="true"></span>
                                    학생: 허가원 제출 및 상태 확인
                                </li>
                                <li className="flex items-center" role="listitem">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2" aria-hidden="true"></span>
                                    교사: 허가원 승인/반려 처리
                                </li>
                                <li className="flex items-center" role="listitem">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" aria-hidden="true"></span>
                                    관리자: 전체 관리 및 사용자 역할 설정
                                </li>
                            </ul>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Google 계정으로 로그인"
                            role="button"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 mr-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                    로그인 중...
                                </>
                            ) : (
                                <>
                                    <FcGoogle className="w-5 h-5 mr-3" aria-hidden="true" />
                                    Google로 로그인
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
