// 역할 관리 유틸리티 함수들

export const getEmailRole = (email: string): 'student' | 'teacher' | 'admin' => {
    // 환경변수에서 이메일 목록 가져오기
    const teacherEmails = process.env.TEACHER_EMAILS?.split(',').map(e => e.trim()) || [];
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];

    if (adminEmails.includes(email)) {
        return 'admin';
    } else if (teacherEmails.includes(email)) {
        return 'teacher';
    } else {
        return 'student';
    }
};

export const isTeacher = (email: string): boolean => {
    const teacherEmails = process.env.TEACHER_EMAILS?.split(',').map(e => e.trim()) || [];
    return teacherEmails.includes(email);
};

export const isAdmin = (email: string): boolean => {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    return adminEmails.includes(email);
};

// 역할별 권한 확인
export const canManageUsers = (userRole: string): boolean => {
    return userRole === 'admin';
};

export const canApprovePermissions = (userRole: string): boolean => {
    return userRole === 'teacher' || userRole === 'admin';
};

export const canSubmitPermissions = (userRole: string): boolean => {
    return userRole === 'student';
};
