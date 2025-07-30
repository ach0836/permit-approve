import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserRole } from '@/types';

// ==================== 역할 할당 유틸리티 ====================

function determineUserRole(email: string): UserRole {
    // ✨ 디버깅 로그
    console.log(`\n[Auth Debug | 1. 역할 결정 시작] 이메일: ${email}`);

    const adminEmailsSrc = process.env.ADMIN_EMAILS;
    const teacherEmailsSrc = process.env.TEACHER_EMAILS;

    // ✨ 디버깅 로그: .env 파일 값을 그대로 출력
    console.log(`[Auth Debug | 1. 역할 결정] .env (ADMIN_EMAILS):`, adminEmailsSrc);
    console.log(`[Auth Debug | 1. 역할 결정] .env (TEACHER_EMAILS):`, teacherEmailsSrc);

    const adminEmails = adminEmailsSrc?.split(',').map(e => e.trim()) || [];
    const teacherEmails = teacherEmailsSrc?.split(',').map(e => e.trim()) || [];

    if (adminEmails.includes(email)) {
        console.log(`[Auth Debug | 1. 역할 결정] 최종 역할: 'admin'`);
        return 'admin';
    }
    if (teacherEmails.includes(email)) {
        console.log(`[Auth Debug | 1. 역할 결정] 최종 역할: 'teacher'`);
        return 'teacher';
    }

    console.log(`[Auth Debug | 1. 역할 결정] 최종 역할: 'student'`);
    return 'student';
}

// ==================== NextAuth 설정 ====================

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // ✨ 디버깅 로그
            console.log(`\n[Auth Debug | 2. signIn 콜백 시작] Provider: ${account?.provider}`);

            if (account?.provider === 'google') {
                if (!user.email) {
                    console.error('[Auth Error] 이메일 정보가 없어 로그인이 거부되었습니다.');
                    return false;
                }

                // ✨ 디버깅 로그
                console.log(`[Auth Debug | 2. signIn 콜백] 로그인 사용자: ${user.email}`);

                try {
                    const userRole = determineUserRole(user.email);

                    // ==================== ✨ 추가된 부분 시작 ✨ ====================
                    // 학생 역할에만 도메인 제한 로직 적용
                    if (userRole === 'student') {
                        // .env 파일에서 허용할 도메인 목록을 가져옵니다.
                        const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
                        const userDomain = user.email.split('@')[1];

                        console.log(`[Auth Debug | 도메인 체크] 사용자 도메인: ${userDomain}`);
                        console.log(`[Auth Debug | 도메인 체크] 허용된 도메인 목록:`, allowedDomains);

                        // 허용된 도메인 목록이 비어있지 않고, 사용자 도메인이 목록에 없다면 로그인 차단
                        if (allowedDomains.length > 0 && !allowedDomains.includes(userDomain)) {
                            console.warn(`[Auth Warning] 허용되지 않은 학생 도메인(${userDomain})의 로그인이 차단되었습니다.`);
                            return false; // 로그인을 거부합니다.
                        }
                    }
                    // ==================== ✨ 추가된 부분 끝 ✨ ======================

                    const userRef = doc(db, 'users', user.email);
                    const userDoc = await getDoc(userRef);

                    // ✨ 디버깅 로그
                    console.log(`[Auth Debug | 3. DB 작업 시작] 결정된 역할: '${userRole}'`);

                    if (!userDoc.exists()) {
                        console.log(`[Auth Debug | 3. DB 작업] 신규 사용자입니다. DB에 문서를 생성합니다.`);
                        await setDoc(userRef, {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            role: userRole,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    } else {
                        console.log(`[Auth Debug | 3. DB 작업] 기존 사용자입니다. DB 문서를 업데이트합니다. (기존 역할: '${userDoc.data().role}')`);
                        await setDoc(userRef, {
                            name: user.name,
                            image: user.image,
                            updatedAt: new Date(),
                            // 역할은 Firestore에 저장된 값을 유지하도록 수정 (만약 역할 동기화가 필요하다면 'role: userRole'로 변경)
                        }, { merge: true });
                    }

                    console.log(`[Auth Debug | 4. 최종 결과] 성공. 로그인을 허용합니다.`);
                    return true;

                } catch (error) {
                    console.error('[Auth Error] signIn 콜백 DB 처리 중 오류 발생:', error);
                    return false;
                }
            }
            return true;
        },

        async session({ session }) {
            if (session.user?.email) {
                try {
                    const userRef = doc(db, 'users', session.user.email);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        session.user.role = userDoc.data().role as UserRole;
                    }
                } catch (error) {
                    console.error('[Auth Error] session 콜백 처리 중 오류 발생:', error);
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
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    debug: false,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };