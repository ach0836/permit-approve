'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissionSlipStore, useAuthStore } from '@/store';
import { User, TEACHERS, LOCATIONS } from '@/types';
import type { PermissionSlip } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { convertPermissionSlipData } from '@/utils/firebase';
import Toast from './Toast';

export default function TeacherDashboard() {
    const { permissionSlips, isLoading, setPermissionSlips, updatePermissionSlip, setLoading } = usePermissionSlipStore();
    const { user } = useAuthStore();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'approval' | 'approved'>('approval');
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

    const fetchPermissionSlips = useCallback(async () => {
        if (!user?.email || !user?.role) return;

        setLoading(true);
        try {
            // 선생님과 관리자는 모든 허가원을 볼 수 있도록 파라미터 추가
            const params = new URLSearchParams();
            params.append('userEmail', user.email);
            params.append('userRole', user.role);
            // 선생님인 경우 자신에게 할당된 허가원만 필터링
            if (user.role === 'teacher') {
                params.append('assignedTeacher', user.email);
            }

            const response = await fetch(`/api/permission-slips?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setPermissionSlips(data.map((slip: unknown) => convertPermissionSlipData(slip as Record<string, unknown>)));
            }
        } catch (error) {
            console.error('Error fetching permission slips:', error);
        } finally {
            setLoading(false);
        }
    }, [setPermissionSlips, setLoading, user?.email, user?.role]);

    useEffect(() => {
        if (user?.email && user?.role) {
            fetchPermissionSlips();
        }
    }, [user?.email, user?.role, fetchPermissionSlips]);

    const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            const response = await fetch(`/api/permission-slips/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    userEmail: user?.email,
                    userName: user?.name
                }),
            });

            if (response.ok) {
                updatePermissionSlip(id, {
                    status,
                    updatedAt: new Date(),
                    processedBy: {
                        email: user?.email || '',
                        name: user?.name || '',
                        processedAt: new Date(),
                    }
                });
                setToast({ message: status === 'approved' ? '승인 완료!' : '반려 처리 완료!', type: 'success' });
            } else {
                const error = await response.json();
                setToast({ message: `❌ 오류: ${error.error}`, type: 'error' });
            }
        } catch (error) {
            console.error('Error updating permission slip:', error);
            setToast({ message: '⚠️ 처리 중 오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
        } finally {
            setProcessingId(null);
        }
    };

    // 승인 대기중인 허가원 (오늘 제출된 것)
    const pendingSlips = permissionSlips.filter(slip => {
        const today = new Date();
        const slipDate = new Date(slip.createdAt);
        const isToday = today.toDateString() === slipDate.toDateString();
        return slip.status === 'pending' && isToday;
    });

    // 오늘 승인된 허가원
    const todayApprovedSlips = permissionSlips.filter(slip => {
        const today = new Date();
        const slipDate = new Date(slip.createdAt);
        const isToday = today.toDateString() === slipDate.toDateString();
        return slip.status === 'approved' && isToday;
    });

    // 실별 승인 현황 계산
    const locationStats = LOCATIONS.map(location => {
        const approvedInLocation = todayApprovedSlips.filter(slip => slip.location === location);
        return {
            location,
            count: approvedInLocation.length,
            slips: approvedInLocation
        };
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* 탭 네비게이션 */}
                <div className="flex bg-white rounded-xl sm:rounded-2xl p-1 sm:p-2 mb-6 sm:mb-8 border border-gray-200">
                    <button
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${activeTab === 'approval'
                            ? 'bg-blue-400 text-white shadow-sm'
                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('approval')}
                    >
                        승인 대기 ({pendingSlips.length})
                    </button>
                    <button
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${activeTab === 'approved'
                            ? 'bg-blue-400 text-white shadow-sm'
                            : 'text-gray-400 hover:text-black hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('approved')}
                    >
                        허가원 현황 ({todayApprovedSlips.length})
                    </button>
                </div>

                {/* 승인 대기 탭 */}
                {activeTab === 'approval' && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4 sm:p-8">
                            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-black">승인 대기중인 허가원</h2>
                                <div className="ml-auto bg-blue-400 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold">
                                    {pendingSlips.length}건
                                </div>
                            </div>

                            {pendingSlips.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">승인 대기중인 허가원이 없습니다</h3>
                                    <p className="text-gray-400 text-sm sm:text-base">새로운 허가원이 제출되면 여기에 표시됩니다.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 sm:space-y-6">
                                    {pendingSlips.map((slip) => (
                                        <div key={slip.id} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                                            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                                                <div className="flex-1 w-full">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                                        <h3 className="font-bold text-black text-lg">{slip.studentName}</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {/* 신청 교시 표시 */}
                                                            {Array.isArray(slip.periods) && slip.periods.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {slip.periods.map((period, idx) => (
                                                                        <span key={idx} className="px-2 py-1 bg-blue-400 text-white rounded-full text-xs font-bold">{period}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {slip.location && (
                                                                <div className="px-3 py-1 bg-gray-100 text-black rounded-full text-xs sm:text-sm font-medium">
                                                                    위치: {slip.location}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 담당 선생님 정보 */}
                                                    {slip.assignedTeacher && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                            <div className="text-sm sm:text-base font-bold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                                                                허가 선생님
                                                            </div>
                                                            <div className="text-blue-400 text-sm sm:text-base font-medium">
                                                                {TEACHERS.find(t => t.email === slip.assignedTeacher)?.name || '선생님'}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 참여 학생 목록 */}
                                                    {slip.students && slip.students.length > 0 && (
                                                        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                            <div className="text-sm sm:text-base font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
                                                                참여 학생 명단 ({slip.students.length}명)
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                                                {slip.students.map((student, index) => (
                                                                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                                                                        <div className="font-bold text-black text-sm sm:text-base">{student.name}</div>
                                                                        <div className="text-xs sm:text-sm text-gray-400 font-medium">{student.studentId}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                        <div className="text-sm sm:text-base font-bold text-black mb-2 sm:mb-3">사유</div>
                                                        <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{slip.reason}</p>
                                                    </div>

                                                    <div className="text-xs sm:text-sm text-gray-400 font-medium">
                                                        제출일: {format(slip.createdAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto lg:ml-6">
                                                    <button
                                                        onClick={() => handleStatusChange(slip.id, 'approved')}
                                                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-blue-400 text-white rounded-xl sm:rounded-2xl hover:bg-blue-400 transition-colors font-bold text-sm sm:text-base flex items-center justify-center gap-2 ${processingId === slip.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={processingId !== null}
                                                    >
                                                        {processingId === slip.id ? (
                                                            <>
                                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                처리중...
                                                            </>
                                                        ) : (
                                                            <>
                                                                승인
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(slip.id, 'rejected')}
                                                        className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-xl sm:rounded-2xl hover:bg-gray-800 transition-colors font-bold text-sm sm:text-base flex items-center justify-center gap-2 ${processingId === slip.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={processingId !== null}
                                                    >
                                                        {processingId === slip.id ? (
                                                            <>
                                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                처리중...
                                                            </>
                                                        ) : (
                                                            <>
                                                                반려
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 오늘 승인된 허가원 탭 */}
                {activeTab === 'approved' && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4 sm:p-8">
                            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-black">오늘 승인된 허가원</h2>
                                <div className="ml-auto bg-blue-400 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold">
                                    {todayApprovedSlips.length}건
                                </div>
                            </div>

                            {/* 실별 현황 버튼 */}
                            <div className="mb-6 sm:mb-8">
                                <h3 className="text-lg font-bold text-black mb-4">실별 승인 현황</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {locationStats.map(({ location, count }) => (
                                        <button
                                            key={location}
                                            onClick={() => {
                                                if (count > 0) {
                                                    setSelectedLocation(selectedLocation === location ? null : location);
                                                }
                                            }}
                                            className={`relative p-4 rounded-2xl font-medium text-center transition-all duration-300 ${count > 0
                                                ? selectedLocation === location
                                                    ? 'bg-gradient-to-br from-blue-400 to-blue-800 text-white shadow-xl transform scale-105 ring-4 ring-blue-300'
                                                    : 'bg-gradient-to-br from-blue-400 to-blue-400 text-white shadow-lg transform hover:scale-105 cursor-pointer'
                                                : 'bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed'
                                                }`}
                                            disabled={count === 0}
                                        >
                                            {count > 0 && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                                                    {count}
                                                </div>
                                            )}
                                            <div className="font-bold text-sm mb-1">{location}</div>
                                            <div className="text-xs opacity-80">
                                                {count > 0 ? (selectedLocation === location ? '선택됨' : '선택') : '없음'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {todayApprovedSlips.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">오늘 승인된 허가원이 없습니다</h3>
                                    <p className="text-gray-400 text-sm sm:text-base">승인된 허가원이 있으면 여기에 표시됩니다.</p>
                                </div>
                            ) : selectedLocation ? (
                                // 선택된 실의 허가원만 표시
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="font-bold text-blue-800 text-lg">{selectedLocation} 허가원</h4>
                                            </div>
                                            <button
                                                onClick={() => setSelectedLocation(null)}
                                                className="px-4 py-2 bg-blue-400 text-white rounded-xl hover:bg-blue-400 transition-colors text-sm font-medium"
                                            >
                                                전체 보기
                                            </button>
                                        </div>
                                    </div>
                                    {todayApprovedSlips
                                        .filter(slip => slip.location === selectedLocation)
                                        .map((slip) => (
                                            <div key={slip.id} className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-gray-200">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                    <div className="flex-1 w-full">
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                                                            <h3 className="font-bold text-black text-lg">{slip.studentName ?? ''}</h3>
                                                            <div className="flex flex-wrap gap-2">
                                                                {/* 신청 교시 표시 */}
                                                                {Array.isArray(slip.periods) && slip.periods.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {slip.periods.map((period, idx) => (
                                                                            <span key={idx} className="px-2 py-1 bg-blue-400 text-white rounded-full text-xs font-bold">{period}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {slip.location && (
                                                                    <div className="px-3 py-1 bg-gray-100 text-black rounded-full text-xs sm:text-sm font-medium">
                                                                        위치: {slip.location}
                                                                    </div>
                                                                )}
                                                                <div className="px-3 py-1 bg-blue-400 text-white rounded-full text-xs sm:text-sm font-medium">
                                                                    승인완료
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 담당 선생님 정보 */}
                                                        {slip.assignedTeacher && (
                                                            <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                                <div className="text-sm sm:text-base font-bold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                                                                    허가 선생님
                                                                </div>
                                                                <div className="text-blue-400 text-sm sm:text-base font-medium">
                                                                    {TEACHERS.find(t => t.email === slip.assignedTeacher)?.name || '선생님'}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 참여 학생 목록 */}
                                                        {Array.isArray(slip.students) && slip.students.length > 0 && (
                                                            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                                <div className="text-sm sm:text-base font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
                                                                    참여 학생 명단 ({slip.students.length}명)
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                                                    {slip.students.map((student, index) => (
                                                                        <div key={index} className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                                                                            <div className="font-bold text-black text-sm sm:text-base">{student.name ?? ''}</div>
                                                                            <div className="text-xs sm:text-sm text-gray-400 font-medium">{student.studentId ?? ''}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                            <div className="text-sm sm:text-base font-bold text-black mb-2 sm:mb-3"> 사유</div>
                                                            <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{slip.reason ?? ''}</p>
                                                        </div>

                                                        <div className="flex justify-between text-xs sm:text-sm text-gray-400 font-medium">
                                                            <span>제출: {slip.createdAt ? format(slip.createdAt, 'HH:mm', { locale: ko }) : ''}</span>
                                                            {slip.processedBy?.processedAt && (
                                                                <span>승인: {format(slip.processedBy.processedAt, 'HH:mm', { locale: ko })}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                // 실을 선택하지 않았을 때 안내 메시지
                                <div className="text-center py-12 sm:py-16">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">실을 선택해주세요</h3>
                                    <p className="text-gray-400 text-sm sm:text-base">위의 실별 현황에서 파란색 버튼을 클릭하면 해당 실의 허가원을 확인할 수 있습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 성공 모달 */}
                <dialog id="success_modal" className="modal">
                    <div className="modal-box bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-200 shadow-2xl max-w-sm sm:max-w-md mx-4">
                        <div className="text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-400 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3">처리 완료!</h3>
                            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed">
                                허가원이 성공적으로 처리되었습니다.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <form method="dialog">
                                <button className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-400 text-white rounded-xl sm:rounded-2xl hover:bg-blue-400 transition-colors font-bold text-sm sm:text-base">
                                    확인
                                </button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
}
