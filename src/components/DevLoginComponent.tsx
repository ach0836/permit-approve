'use client';

import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { FaClipboardList, FaUser, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';

const mockUsers = {
    student: {
        id: 'student@test.com',
        email: 'student@test.com',
        name: '김학생',
        image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
        role: 'student' as UserRole,
    },
    teacher: {
        id: 'teacher@test.com',
        email: 'teacher@test.com',
        name: '이교사',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        role: 'teacher' as UserRole,
    },
    admin: {
        id: 'admin@test.com',
        email: 'admin@test.com',
        name: '박관리자',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        role: 'admin' as UserRole,
    },
};

export default function DevLoginComponent() {
    const { setUser } = useAuthStore();
    const router = useRouter();

    const handleLogin = (role: UserRole) => {
        const user = mockUsers[role];
        setUser(user);
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-3 sm:px-4">
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-200 p-6 sm:p-12">
                    <div className="text-center mb-8 sm:mb-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <FaClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4">
                            디지털 허가원 시스템
                        </h1>
                        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                            개발 모드 - 역할을 선택하여 로그인하세요
                        </p>
                        <div className="inline-block bg-gray-100 text-black px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold">개발 모드</div>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {/* 학생 로그인 */}
                        <button
                            onClick={() => handleLogin('student')}
                            className="w-full bg-white border-2 border-gray-200 hover:border-blue-600 text-black rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-100 overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                                    <img src={mockUsers.student.image} alt="학생" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-bold text-lg sm:text-xl text-black mb-1 truncate">{mockUsers.student.name}</div>
                                    <div className="text-gray-600 mb-2 text-sm sm:text-base">학생으로 로그인</div>
                                    <div className="inline-flex items-center gap-1 sm:gap-2 bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                        <FaUser className="w-2 h-2 sm:w-3 sm:h-3" />
                                        학생
                                    </div>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <FaClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                            </div>
                        </button>

                        {/* 교사 로그인 */}
                        <button
                            onClick={() => handleLogin('teacher')}
                            className="w-full bg-white border-2 border-gray-200 hover:border-blue-600 text-black rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-100 overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                                    <img src={mockUsers.teacher.image} alt="교사" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-bold text-lg sm:text-xl text-black mb-1 truncate">{mockUsers.teacher.name}</div>
                                    <div className="text-gray-600 mb-2 text-sm sm:text-base">교사로 로그인</div>
                                    <div className="inline-flex items-center gap-1 sm:gap-2 bg-black text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                        <FaChalkboardTeacher className="w-2 h-2 sm:w-3 sm:h-3" />
                                        교사
                                    </div>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <FaChalkboardTeacher className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                                </div>
                            </div>
                        </button>

                        {/* 관리자 로그인 */}
                        <button
                            onClick={() => handleLogin('admin')}
                            className="w-full bg-white border-2 border-gray-200 hover:border-blue-600 text-black rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-200"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gray-100 overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                                    <img src={mockUsers.admin.image} alt="관리자" className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-bold text-lg sm:text-xl text-black mb-1 truncate">{mockUsers.admin.name}</div>
                                    <div className="text-gray-600 mb-2 text-sm sm:text-base">관리자로 로그인</div>
                                    <div className="inline-flex items-center gap-1 sm:gap-2 bg-gray-800 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                        <FaUserShield className="w-2 h-2 sm:w-3 sm:h-3" />
                                        관리자
                                    </div>
                                </div>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <FaUserShield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-800" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-6 sm:mt-10 p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-200">
                        <h3 className="font-bold text-black mb-4 sm:mb-6 text-base sm:text-lg flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <FaClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                            각 역할의 기능
                        </h3>
                        <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <li className="flex items-center bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                                <div>
                                    <strong className="text-black">학생:</strong> <span className="text-gray-600">허가원 제출 및 상태 확인</span>
                                </div>
                            </li>
                            <li className="flex items-center bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                                <div>
                                    <strong className="text-black">교사:</strong> <span className="text-gray-600">허가원 승인/반려 처리</span>
                                </div>
                            </li>
                            <li className="flex items-center bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200">
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-800 rounded-full mr-3 sm:mr-4 flex-shrink-0"></div>
                                <div>
                                    <strong className="text-black">관리자:</strong> <span className="text-gray-600">전체 관리 및 사용자 역할 설정</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
