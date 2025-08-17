'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissionSlipStore, useAuthStore } from '@/store';
import { studentList } from '@/utils/studentList';
import { PermissionSlip, PermissionSlipStatus, Student, LOCATIONS, TEACHERS, LocationType } from '@/types';
import Toast from './Toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaPlus, FaTrash, FaMapMarkerAlt, FaUsers, FaClipboardList, FaPaperPlane, FaClock, FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa';
import { convertPermissionSlipData } from '@/utils/firebase';

const getStatusBadge = (status: PermissionSlipStatus) => {
    switch (status) {
        case 'pending':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    <FaClock className="w-3 h-3" />
                    검토중
                </div>
            );
        case 'approved':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-400 text-white rounded-full text-sm font-medium">
                    <FaCheckCircle className="w-3 h-3" />
                    승인완료
                </div>
            );
        case 'rejected':
            return (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-sm font-medium">
                    <FaTimesCircle className="w-3 h-3" />
                    반려
                </div>
            );
        default:
            return null;
    }
};

export default function StudentDashboard() {
    const [selectedLocation, setSelectedLocation] = useState<LocationType | ''>('');
    // 시간 선택 (복수 선택 가능, 야자 1,2교시만)
    const PERIODS = ['1교시', '2교시'];
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [students, setStudents] = useState<Student[]>([{ name: '', studentId: '' }]);
    const [reason, setReason] = useState('');
    const [assignedTeacher, setAssignedTeacher] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
    const { permissionSlips, isLoading, setPermissionSlips, addPermissionSlip, setLoading } = usePermissionSlipStore();
    const { user } = useAuthStore();

    // 상태 복원: localStorage에서 폼 데이터 복원 (클라이언트에서만)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const savedLocation = localStorage.getItem('studentDashboard_location');
        const savedStudents = localStorage.getItem('studentDashboard_students');
        const savedReason = localStorage.getItem('studentDashboard_reason');
        const savedTeacher = localStorage.getItem('studentDashboard_teacher');
        const savedPeriods = localStorage.getItem('studentDashboard_periods');
        if (savedLocation) setSelectedLocation(savedLocation as LocationType);
        if (savedStudents) {
            try {
                setStudents(JSON.parse(savedStudents));
            } catch { }
        }
        if (savedReason) setReason(savedReason);
        if (savedTeacher) setAssignedTeacher(savedTeacher);
        if (savedPeriods) {
            try {
                setSelectedPeriods(JSON.parse(savedPeriods));
            } catch { }
        }
    }, []);

    // 상태 저장: localStorage에 폼 데이터 저장 (클라이언트에서만)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('studentDashboard_location', selectedLocation);
        localStorage.setItem('studentDashboard_students', JSON.stringify(students));
        localStorage.setItem('studentDashboard_reason', reason);
        localStorage.setItem('studentDashboard_teacher', assignedTeacher);
        localStorage.setItem('studentDashboard_periods', JSON.stringify(selectedPeriods));
    }, [selectedLocation, students, reason, assignedTeacher]);

    const fetchPermissionSlips = useCallback(async () => {
        if (!user?.email || !user?.role) return;

        setLoading(true);
        try {
            // 사용자 정보를 포함한 API 요청
            const params = new URLSearchParams();
            params.append('userEmail', user.email);
            params.append('userRole', user.role);

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
    }, [fetchPermissionSlips]);

    const addStudent = () => {
        if (students.length < 20) {
            setStudents([...students, { name: '', studentId: '' }]);
        }
    };

    const removeStudent = (index: number) => {
        if (students.length > 1) {
            setStudents(students.filter((_, i) => i !== index));
        }
    };

    const updateStudent = (index: number, field: keyof Student, value: string) => {
        const updatedStudents = students.map((student, i) => {
            if (i !== index) return student;
            if (field === 'name') {
                const found = studentList.find(s => s.name === value);
                return {
                    ...student,
                    name: value,
                    studentId: found ? found.studentId : ''
                };
            }
            return { ...student, [field]: value };
        });
        setStudents(updatedStudents);
    };

    const resetForm = () => {
        setSelectedLocation('');
        setStudents([{ name: '', studentId: '' }]);
        setReason('');
        setAssignedTeacher('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 유효성 검사
        if (!selectedLocation) {
            alert('장소를 선택해주세요.');
            return;
        }
        if (selectedPeriods.length === 0) {
            alert('시간(교시)을 선택해주세요.');
            return;
        }
        if (!reason.trim()) {
            alert('사유를 입력해주세요.');
            return;
        }
        if (!assignedTeacher) {
            alert('담당 선생님을 선택해주세요.');
            return;
        }
        // 모든 학생 정보가 입력되었는지 확인
        const validStudents = students.filter(student =>
            student.name.trim() && student.studentId.trim()
        );
        if (validStudents.length === 0) {
            alert('👥 최소 1명의 학생 정보를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/permission-slips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: selectedLocation,
                    students: validStudents,
                    reason: reason.trim(),
                    assignedTeacher: assignedTeacher,
                    periods: selectedPeriods,
                    userEmail: user?.email,
                    userName: user?.name
                }),
            });
            if (response.ok) {
                const newSlip = await response.json();
                addPermissionSlip(convertPermissionSlipData(newSlip as Record<string, unknown>) as PermissionSlip);
                resetForm();
                setSelectedPeriods([]);
                setToast({ message: '신청이 완료되었습니다!', type: 'success' });
            } else {
                const error = await response.json();
                setToast({ message: `❌ 오류: ${error.error}`, type: 'error' });
            }
        } catch (error) {
            console.error('Error submitting permission slip:', error);
            setToast({ message: '⚠️ 허가원 제출 중 오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-lg mx-auto pt-20">
                    <div className="bg-white rounded-3xl p-8 border border-gray-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-lg font-semibold text-black mb-2">불러오는 중</h3>
                            <p className="text-gray-400">허가원 정보를 가져오고 있어요</p>
                        </div>
                    </div>
                </div>
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
            <div className="max-w-full sm:max-w-2xl mx-auto px-2 sm:px-6 py-2 sm:py-8 space-y-4 sm:space-y-8">
                {/* 허가원 제출 폼 */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-3 sm:p-8">
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                                <FaClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-black">허가원 신청</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                            {/* 장소 선택 */}
                            <div className="mb-4 sm:mb-0">
                                <label className="block text-sm sm:text-base font-bold text-black mb-3 sm:mb-4">
                                    <FaMapMarkerAlt className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                                    허가원 장소
                                </label>
                                <div className="relative group">
                                    <select
                                        className="w-full p-3 sm:p-5 pr-10 sm:pr-12 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white to-gray-50 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all duration-300 outline-none text-xs sm:text-base text-black appearance-none cursor-pointer shadow-sm hover:shadow-lg hover:border-blue-300 group-hover:from-blue-50 group-hover:to-white overflow-y-auto max-h-52 sm:max-h-60"
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value as LocationType | '')}
                                        required
                                    >
                                        <option value="" disabled className="text-gray-400 bg-white">장소를 선택하세요</option>
                                        {LOCATIONS.map((location) => (
                                            <option key={location} value={location} className="text-black py-3 bg-white hover:bg-blue-50">
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-400 rounded-lg flex items-center justify-center group-hover:bg-blue-400 transition-colors">
                                            <svg className="w-4 h-4 text-white transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {selectedLocation && (
                                    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-blue-800">
                                            <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                                                <FaMapMarkerAlt className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                            </div>
                                            <span className="font-bold">선택된 장소:</span>
                                            <span className="font-medium bg-white px-3 py-1 rounded-full border border-blue-300">{selectedLocation}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 시간 선택 (복수 선택 가능) */}
                            <div className="mb-4">
                                <label className="block text-sm sm:text-base font-bold text-black mb-3 sm:mb-4">
                                    <FaClock className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                                    시간 선택 (복수 선택 가능)
                                </label>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {PERIODS.map(period => (
                                        <button
                                            key={period}
                                            type="button"
                                            className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-base border-2 transition-all duration-150 ${selectedPeriods.includes(period) ? 'bg-blue-400 text-white border-blue-400' : 'bg-white text-blue-400 border-blue-200 hover:bg-blue-50'}`}
                                            onClick={() => {
                                                setSelectedPeriods(selectedPeriods.includes(period)
                                                    ? selectedPeriods.filter(p => p !== period)
                                                    : [...selectedPeriods, period]);
                                            }}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                                {selectedPeriods.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm flex flex-wrap gap-2 text-xs sm:text-sm text-blue-800">
                                        <span className="font-bold">선택된 시간:</span>
                                        {selectedPeriods.map(period => (
                                            <span key={period} className="bg-white px-3 py-1 rounded-full border border-blue-300">{period}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 담당 선생님 선택 */}
                            <div>
                                <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black mb-3 sm:mb-4 mt-2 sm:mt-3">
                                    <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                                    <span>승인 받을 선생님을 선택하세요</span>
                                </label>
                                <div className="relative group">
                                    <select
                                        className="w-full p-3 sm:p-5 pr-10 sm:pr-12 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white to-gray-50 focus:border-green-400 focus:ring-4 focus:ring-green-100 focus:bg-white transition-all duration-300 outline-none text-xs sm:text-base text-black appearance-none cursor-pointer shadow-sm hover:shadow-lg hover:border-green-400 group-hover:from-green-50 group-hover:to-white overflow-y-auto max-h-52 sm:max-h-60"
                                        value={assignedTeacher}
                                        onChange={(e) => setAssignedTeacher(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled className="text-gray-400 bg-white">선생님을 선택하세요</option>
                                        {TEACHERS.map((teacher) => (
                                            <option key={teacher.email} value={teacher.email} className="text-black py-3 bg-white hover:bg-green-50">
                                                {teacher.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-400 rounded-lg flex items-center justify-center group-hover:bg-green-700 transition-colors">
                                            <svg className="w-4 h-4 text-white transform group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                {assignedTeacher && (
                                    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-green-800">
                                            <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                                <FaUser className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                            </div>
                                            <span className="font-bold">담당 선생님:</span>
                                            <span className="font-medium bg-white px-3 py-1 rounded-full border border-green-300">{TEACHERS.find(t => t.email === assignedTeacher)?.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 학생 목록 */}
                            <div>
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <label className="block text-xs sm:text-base font-bold text-black">
                                        허가원 인원을 작성하세요
                                    </label>
                                    <span className="text-xs sm:text-sm text-gray-400 bg-gray-100 px-2 sm:px-4 py-1 rounded-full font-semibold flex items-center justify-center" style={{ minWidth: '70px', textAlign: 'center' }}>
                                        {students.length}/20명
                                    </span>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    {students.map((student, index) => (
                                        <div key={index} className="flex gap-1 sm:gap-4 items-center p-2 sm:p-4 bg-white rounded-xl sm:rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all">
                                            <div className="flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 bg-gray-100 text-black font-bold rounded-xl sm:rounded-2xl text-xs sm:text-base flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="이름"
                                                className="flex-1 min-w-0 p-2 sm:p-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white focus:border-blue-400 transition-all outline-none text-xs sm:text-base text-black placeholder-gray-400"
                                                value={student.name}
                                                onChange={(e) => updateStudent(index, 'name', e.target.value)}
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="학번"
                                                className="flex-1 min-w-0 p-2 sm:p-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white focus:border-blue-400 transition-all outline-none text-xs sm:text-base text-black placeholder-gray-400"
                                                value={student.studentId}
                                                onChange={(e) => updateStudent(index, 'studentId', e.target.value)}
                                                required
                                            />
                                            {students.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStudent(index)}
                                                    className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 text-black rounded-xl sm:rounded-2xl hover:bg-black hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
                                                    title="학생 삭제"
                                                >
                                                    <FaTrash className="w-2 h-2 sm:w-4 sm:h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 gap-3">
                                    <button
                                        type="button"
                                        onClick={addStudent}
                                        className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-3 px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-green-400 to-green-400 text-white rounded-xl sm:rounded-2xl hover:from-green-400 hover:to-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 font-semibold text-xs sm:text-base shadow-md hover:shadow-lg"
                                        disabled={students.length >= 20}
                                    >
                                        <FaPlus className="w-3 h-3 sm:w-5 sm:h-5" />
                                        {students.length === 1 ? '학생 추가하기' : `학생 추가 (${students.length}/20)`}
                                    </button>
                                    {students.length >= 20 && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl font-medium">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            최대 20명까지 추가할 수 있습니다
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 사유 입력 */}
                            <div>
                                <label className="block text-sm sm:text-base font-bold text-black mb-5 sm:mb-7">
                                    <FaClipboardList className="inline w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                                    허가원 사유를 작성하시요
                                </label>
                                <div className="relative">
                                    <textarea
                                        className="w-full p-4 sm:p-5 border-2 border-gray-200 rounded-xl sm:rounded-2xl bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none text-sm sm:text-base text-black placeholder-gray-400 shadow-sm hover:shadow-md"
                                        placeholder="허가원 사유를 입력하세요, 종이 허가원처럼"
                                        rows={4}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required
                                        maxLength={400}
                                    />
                                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded-full border">
                                        {reason.length}/400
                                    </div>
                                </div>
                                {reason.length > 450 && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-xs text-amber-800">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>글자 수 제한에 가까워지고 있습니다</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 제출 버튼 */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 sm:py-5 px-3 sm:px-8 bg-gray-100 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 font-semibold text-xs sm:text-base shadow-sm hover:shadow-md"
                                    disabled={isSubmitting}
                                >
                                    <span className="flex items-center justify-center gap-1 sm:gap-2">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        초기화
                                    </span>
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 sm:py-5 px-3 sm:px-8 bg-gradient-to-r from-blue-400 to-blue-400 text-white rounded-xl sm:rounded-2xl hover:from-blue-400 hover:to-blue-400 active:scale-95 transition-all disabled:opacity-50 font-bold text-xs sm:text-base shadow-lg hover:shadow-xl"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            제출하는 중...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 sm:gap-3">
                                            <FaPaperPlane className="w-3 h-3 sm:w-5 sm:h-5" />
                                            허가원 제출하기
                                        </span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* 제출한 허가원 목록 */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 sm:p-8">
                        <div className="flex items-center gap-3 mb-6 sm:mb-8">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <FaClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-black">제출한 허가원</h2>
                        </div>

                        {(() => {
                            const today = new Date();
                            const todaySlips = permissionSlips.filter(slip => {
                                const slipDate = new Date(slip.createdAt);
                                return today.toDateString() === slipDate.toDateString();
                            });
                            if (todaySlips.length === 0) {
                                return (
                                    <div className="text-center py-12 sm:py-16">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                            <FaClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-black mb-2 sm:mb-3">오늘 제출한 허가원이 없습니다</h3>
                                        <p className="text-gray-400 text-sm sm:text-base">위 폼을 통해 허가원을 제출해보세요!</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    {todaySlips.map((slip) => (
                                        <div key={slip.id} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 gap-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-black rounded-full text-xs sm:text-sm font-bold">
                                                        <FaMapMarkerAlt className="w-3 h-3" />
                                                        {slip.location || '장소 미지정'}
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-black rounded-full text-xs sm:text-sm font-bold">
                                                        <FaUsers className="w-3 h-3" />
                                                        {slip.students?.length || 0}명
                                                    </div>
                                                </div>
                                                {getStatusBadge(slip.status)}
                                            </div>

                                            {/* 참여 학생 목록 */}
                                            {slip.students && slip.students.length > 0 && (
                                                <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                    <div className="text-sm sm:text-base font-bold text-black mb-3 sm:mb-4 flex items-center gap-2">
                                                        <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        참여 학생 명단
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-1">
                                                        {slip.students.map((student, studentIndex) => (
                                                            <div key={studentIndex} className="bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
                                                                <div className="font-bold text-black text-sm sm:text-base">{student.name}</div>
                                                                <div className="text-xs sm:text-sm text-gray-400 font-medium">{student.studentId}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 담당 선생님 정보 */}
                                            {slip.assignedTeacher && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                    <div className="text-sm sm:text-base font-bold text-green-800 mb-2 sm:mb-3 flex items-center gap-2">
                                                        <FaUser className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        담당 선생님
                                                    </div>
                                                    <div className="text-green-700 text-sm sm:text-base font-medium">
                                                        {TEACHERS.find(t => t.email === slip.assignedTeacher)?.name || '선생님'}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-5">
                                                <div className="text-sm sm:text-base font-bold text-black mb-2 sm:mb-3">사유</div>
                                                <p className="text-gray-800 leading-relaxed text-sm sm:text-base">{slip.reason}</p>
                                            </div>

                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-gray-400 font-medium gap-2">
                                                <span>
                                                    제출일: {format(slip.createdAt, 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                                                </span>
                                                {slip.processedBy && (
                                                    <span className="text-right">
                                                        처리: {slip.processedBy.name} ({format(slip.processedBy.processedAt, 'MM월 dd일 HH:mm', { locale: ko })})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 성공 모달 */}
                <dialog id="success_modal" className="modal">
                    <div className="modal-box bg-white rounded-3xl border-2 border-gray-200 shadow-2xl max-w-sm sm:max-w-md mx-4 overflow-hidden">
                        <div className="text-center relative">
                            {/* 배경 장식 */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>

                            {/* 성공 애니메이션 아이콘 */}
                            <div className="relative z-10">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg animate-pulse">
                                    <FaCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-black mb-3 sm:mb-4">제출 완료!</h3>
                                <div className="space-y-2 mb-8 sm:mb-10">
                                    <p className="text-gray-700 text-base sm:text-lg font-medium">
                                        🎉 허가원이 성공적으로 제출되었습니다
                                    </p>
                                    <p className="text-gray-400 text-sm sm:text-base">
                                        선생님의 승인을 기다려주세요
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center relative z-10">
                            <form method="dialog">
                                <button className="px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-400 to-green-400 text-white rounded-2xl hover:from-blue-400 hover:to-green-400 active:scale-95 transition-all font-bold text-base sm:text-lg shadow-lg hover:shadow-xl">
                                    완료
                                </button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
}
