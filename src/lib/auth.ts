import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '@/types';

// ==================== 역할 할당 유틸리티 ====================

/**
 * 이메일 주소를 기반으로 사용자 역할을 결정
 * 우선순위: admin > teacher > student (기본값)
 */
function determineUserRole(email: string): UserRole {
    // 환경변수에서 이메일 목록 가져오기
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const teacherEmails = process.env.TEACHER_EMAILS?.split(',').map(e => e.trim()) || [
        // 백업 기본값 (환경변수가 설정되지 않은 경우)
        'gcy000515@gmail.com',
        'kim.teacher@school.com',
        'lee.teacher@school.com',
        'park.teacher@school.com',
        'choi.teacher@school.com',
        'jung.teacher@school.com',
        'kang.teacher@school.com',
        'yoon.teacher@school.com',
        'jang.teacher@school.com'
    ];

    if (adminEmails.includes(email)) return 'admin';
    if (teacherEmails.includes(email)) return 'teacher';
    return 'student';
}

// ==================== NextAuth 설정 ====================

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-client-secret',
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                try {
                    // 이메일 기반 역할 결정
                    const userRole = determineUserRole(user.email!);

                    // 사용자 정보를 Firestore에 저장/업데이트
                    const userRef = doc(db, 'users', user.email!);
                    const userDoc = await getDoc(userRef);

                    if (!userDoc.exists()) {
                        // 신규 사용자 - 자동 역할 할당
                        await setDoc(userRef, {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            role: userRole,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    } else {
                        // 기존 사용자 - 정보 업데이트
                        const existingData = userDoc.data();
                        await setDoc(userRef, {
                            ...existingData,
                            name: user.name,
                            image: user.image,
                            updatedAt: new Date(),
                            // 기존 student가 teacher/admin으로 승격된 경우 역할 업데이트
                            role: existingData.role === 'student' && userRole !== 'student'
                                ? userRole
                                : existingData.role,
                        }, { merge: true });
                    }

                    return true;
                } catch (error) {
                    console.error('사용자 정보 저장 중 오류:', error);
                    return false;
                }
            }
            return true;
        },

        async session({ session }) {
            if (session.user?.email) {
                try {
                    // Firestore에서 사용자 역할 정보 가져오기
                    const userRef = doc(db, 'users', session.user.email);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        session.user = {
                            ...session.user,
                            role: userData.role as UserRole,
                        };
                    }
                } catch (error) {
                    console.error('사용자 역할 조회 중 오류:', error);
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
    session: {
        strategy: 'jwt',
    },
    // 접근성 개선을 위한 설정
    useSecureCookies: process.env.NODE_ENV === 'production',
    debug: false, // 보안을 위해 디버그 로그 비활성화
};
