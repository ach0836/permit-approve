// ==================== 기본 타입 정의 ====================

export type UserRole = 'student' | 'teacher' | 'admin';
export type PermissionSlipStatus = 'pending' | 'approved' | 'rejected';

// ==================== 인터페이스 정의 ====================

export interface User {
    email: string;
    name: string;
    role: UserRole;
    image?: string;
}

export interface Student {
    name: string;
    studentId: string;
}

export interface PermissionSlip {
    id: string;
    studentEmail: string;
    studentName: string;
    location: string;
    students: Student[];
    reason: string;
    status: PermissionSlipStatus;
    createdAt: Date;
    updatedAt: Date;
    assignedTeacher?: string; // 선생님 이메일
    processedBy?: {
        email: string;
        name: string;
        processedAt: Date;
    };
    periods?: Array<'1교시' | '2교시'>;
}

// ==================== 상수 데이터 ====================

// 장소 목록 - 새로운 실험실/교실 추가 시 여기에 추가
export const LOCATIONS = [
    // 화학 관련
    '화학실험실',
    '화학교과교실',

    // 물리 관련
    '물리실험실',
    '물리교과교실',

    // 생명과학 관련
    '생명실험실',
    '생명교과교실',

    // 지구과학 관련
    '지구실험실',
    '지구교과교실',

    // IT/공학 관련
    '정보컴퓨터실',
    'AI융합교실',
    '딥러닝실',
    '첨단분석실',
    '첨단공학실',
    '창의공작실'
] as const;

// 선생님 목록 - 새로운 선생님 추가 시 여기에 추가
// 주의: .env 파일의 TEACHER_EMAILS와 src/lib/auth.ts의 목록도 함께 업데이트 필요
export const TEACHERS = [
    { email: 'gcy000515@gmail.com', name: '강채영 선생님' },
    { email: 'kim.teacher@school.com', name: '김선생님' },
    { email: 'lee.teacher@school.com', name: '이선생님' },
    { email: 'park.teacher@school.com', name: '박선생님' },
    { email: 'choi.teacher@school.com', name: '최선생님' },
    { email: 'jung.teacher@school.com', name: '정선생님' },
    { email: 'kang.teacher@school.com', name: '강선생님' },
    { email: 'yoon.teacher@school.com', name: '윤선생님' },
    { email: 'jang.teacher@school.com', name: '장선생님' }
] as const;

// ==================== 타입 유틸리티 ====================

export type LocationType = typeof LOCATIONS[number];
export type TeacherEmail = typeof TEACHERS[number]['email'];
export type TeacherName = typeof TEACHERS[number]['name'];
