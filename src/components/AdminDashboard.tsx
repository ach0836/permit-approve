'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissionSlipStore, useAuthStore } from '@/store';
import { PermissionSlipStatus, User, UserRole, TEACHERS } from '@/types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { groupBy } from 'lodash';
import { convertPermissionSlipData, convertFirebaseTimestamp } from '@/utils/firebase';

const getStatusBadge = (status: PermissionSlipStatus) => {
    switch (status) {
        case 'pending':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    🕒 검토중
                </div>
            );
        case 'approved':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                    ✅ 승인완료
                </div>
            );
        case 'rejected':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-sm font-medium">
                    ❌ 반려
                </div>
            );
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

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const { permissionSlips, isLoading, setPermissionSlips, setLoading } = usePermissionSlipStore();
    const { user } = useAuthStore();

    const fetchPermissionSlips = useCallback(async () => {
        setLoading(true);
        try {
            // 관리자는 모든 허가원을 볼 수 있도록 파라미터 추가
            const params = new URLSearchParams();
            if (user?.email) {
                params.append('userEmail', user.email);
            }
            if (user?.role) {
                params.append('userRole', user.role);
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

    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data.map((userData: unknown) => {
                    const user = userData as Record<string, unknown>;
                    return {
                        ...user,
                        createdAt: convertFirebaseTimestamp(user.createdAt as string | number | Date | Record<string, unknown>),
                        updatedAt: convertFirebaseTimestamp(user.updatedAt as string | number | Date | Record<string, unknown>),
                    };
                }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        fetchPermissionSlips();
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab, fetchPermissionSlips, fetchUsers]);

    const handleRoleChange = async (email: string, newRole: UserRole) => {
        setUpdatingUserId(email);
        try {
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, role: newRole }),
            });

            if (response.ok) {
                setUsers(users.map(user =>
                    user.email === email
                        ? { ...user, role: newRole, updatedAt: new Date() }
                        : user
                ));

                // 성공 알림
                const modal = document.getElementById('success_modal') as HTMLDialogElement;
                if (modal) modal.showModal();
            } else {
                const error = await response.json();
                alert(`오류: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('역할 변경 중 오류가 발생했습니다.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    // 허가원을 상태별로 그룹화
    const groupedSlips = groupBy(permissionSlips, 'status');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* 탭 네비게이션 */}
                <div className="flex bg-white rounded-xl sm:rounded-2xl p-1 sm:p-2 mb-6 sm:mb-8 border border-gray-200">
                    <button
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${activeTab === 'requests'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-black hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('requests')}
                    >
                        <span className="hidden sm:inline">📋 </span>요청 관리
                    </button>
                    <button
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${activeTab === 'users'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-black hover:bg-gray-50'
                            }`}
                        onClick={() => setActiveTab('users')}
                    >
                        <span className="hidden sm:inline">👥 </span>사용자 관리
                    </button>
                </div>

                {/* 요청 관리 탭 */}
                {activeTab === 'requests' && (
                    <div className="space-y-8">
                        {isLoading ? (
                            <div className="bg-white rounded-3xl p-8 border border-gray-200">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-black mb-2">불러오는 중</h3>
                                    <p className="text-gray-600">허가원 정보를 가져오고 있어요</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {(['pending', 'approved', 'rejected'] as PermissionSlipStatus[]).map(status => (
                                    <div key={status} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${status === 'pending' ? 'bg-gray-100' :
                                                    status === 'approved' ? 'bg-blue-600' : 'bg-black'
                                                    }`}>
                                                    <span className={`text-lg ${status === 'pending' ? 'text-gray-600' : 'text-white'
                                                        }`}>
                                                        {status === 'pending' && '🕒'}
                                                        {status === 'approved' && '✅'}
                                                        {status === 'rejected' && '❌'}
                                                    </span>
                                                </div>
                                                <h2 className="text-2xl font-bold text-black">
                                                    {status === 'pending' && '대기중인 허가원'}
                                                    {status === 'approved' && '승인된 허가원'}
                                                    {status === 'rejected' && '반려된 허가원'}
                                                </h2>
                                                <div className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                                    {groupedSlips[status]?.length || 0}건
                                                </div>
                                            </div>

                                            {!groupedSlips[status] || groupedSlips[status].length === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                        <span className="text-2xl text-gray-400">📋</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-black mb-2">해당하는 허가원이 없습니다</h3>
                                                    <p className="text-gray-600">새로운 허가원이 제출되면 여기에 표시됩니다.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {groupedSlips[status].map((slip) => (
                                                        <div key={slip.id} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-4">
                                                                        <span className="font-bold text-black text-lg">{slip.studentName}</span>
                                                                        <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                                            {slip.studentEmail}
                                                                        </div>
                                                                        {slip.location && (
                                                                            <div className="px-3 py-1 bg-gray-200 text-black rounded-full text-sm font-medium">
                                                                                📍 {slip.location}
                                                                            </div>
                                                                        )}
                                                                        {getStatusBadge(slip.status)}
                                                                    </div>

                                                                    {/* 담당 선생님 정보 */}
                                                                    {slip.assignedTeacher && (
                                                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                                                            <div className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                                                                👨‍🏫 담당 선생님
                                                                            </div>
                                                                            <div className="text-green-700 font-medium">
                                                                                {TEACHERS.find(t => t.email === slip.assignedTeacher)?.name || '선생님'}
                                                                                <span className="text-green-600 text-sm ml-2">({slip.assignedTeacher})</span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* 참여 학생 목록 */}
                                                                    {slip.students && slip.students.length > 0 && (
                                                                        <div className="bg-white rounded-xl p-4 mb-4">
                                                                            <div className="text-sm font-bold text-black mb-3">
                                                                                👥 참여 학생 ({slip.students.length}명)
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {slip.students.map((student, index) => (
                                                                                    <div key={index} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
                                                                                        {student.name} ({student.studentId})
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div className="bg-white rounded-xl p-4 mb-4">
                                                                        <div className="text-sm font-bold text-black mb-2">외출 사유</div>
                                                                        <p className="text-gray-800 leading-relaxed">{slip.reason}</p>
                                                                    </div>

                                                                    <div className="text-sm text-gray-600 font-medium space-y-1">
                                                                        <p>제출일: {format(slip.createdAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}</p>
                                                                        {slip.processedBy && (
                                                                            <p>처리: {slip.processedBy.name} ({format(slip.processedBy.processedAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })})</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* 사용자 관리 탭 */}
                {activeTab === 'users' && (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-lg">👥</span>
                                </div>
                                <h2 className="text-2xl font-bold text-black">사용자 관리</h2>
                                <div className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                                    {users.length}명
                                </div>
                            </div>

                            {isLoadingUsers ? (
                                <div className="flex flex-col items-center text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-black mb-2">불러오는 중</h3>
                                    <p className="text-gray-600">사용자 정보를 가져오고 있어요</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <div className="grid gap-4">
                                        {users.map((user) => (
                                            <div key={user.email} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {user.image && (
                                                            <div className="w-12 h-12 rounded-2xl overflow-hidden">
                                                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-black text-lg">{user.name}</div>
                                                            <div className="text-sm text-gray-600 font-medium">{user.email}</div>
                                                            <div className="text-xs text-gray-500 font-medium mt-1">
                                                                가입일: {format(user.createdAt, 'yyyy-MM-dd', { locale: ko })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${user.role === 'admin' ? 'bg-black text-white' :
                                                            user.role === 'teacher' ? 'bg-blue-600 text-white' :
                                                                'bg-gray-200 text-black'
                                                            }`}>
                                                            {getRoleText(user.role)}
                                                        </div>
                                                        <select
                                                            className="px-4 py-2 border-2 border-gray-200 rounded-xl bg-white focus:border-blue-600 transition-all outline-none text-sm font-medium text-black"
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.email, e.target.value as UserRole)}
                                                            disabled={updatingUserId === user.email}
                                                        >
                                                            <option value="student">학생</option>
                                                            <option value="teacher">교사</option>
                                                            <option value="admin">관리자</option>
                                                        </select>
                                                        {updatingUserId === user.email && (
                                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 성공 모달 */}
                <dialog id="success_modal" className="modal">
                    <div className="modal-box bg-white rounded-3xl border-2 border-gray-200 shadow-2xl max-w-md">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <span className="text-white text-4xl">✅</span>
                            </div>
                            <h3 className="text-2xl font-bold text-black mb-3">처리 완료!</h3>
                            <p className="text-gray-600 mb-8 text-base leading-relaxed">
                                {activeTab === 'users' ? '사용자 역할이 성공적으로 변경되었습니다.' : '작업이 완료되었습니다.'}
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <form method="dialog">
                                <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-bold text-base">
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
