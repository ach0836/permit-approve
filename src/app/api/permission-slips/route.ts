import { NextRequest, NextResponse } from 'next/server';
import { PermissionSlipStatus } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
    try {
        // URL에서 사용자 정보 추출
        const { searchParams } = new URL(request.url);
        const userEmail = searchParams.get('userEmail');
        const userRole = searchParams.get('userRole');
        const assignedTeacher = searchParams.get('assignedTeacher');

        const permissionSlipsRef = collection(db, 'permissionSlips');
        let querySnapshot;

        // 학생인 경우 자신이 제출한 허가원만 필터링 (인덱스 없이)
        if (userRole === 'student' && userEmail) {
            const studentQuery = query(
                permissionSlipsRef,
                where('studentEmail', '==', userEmail)
            );
            querySnapshot = await getDocs(studentQuery);
        }
        // 선생님인 경우 자신에게 할당된 허가원만 필터링
        else if (userRole === 'teacher' && assignedTeacher) {
            const teacherQuery = query(
                permissionSlipsRef,
                where('assignedTeacher', '==', assignedTeacher)
            );
            querySnapshot = await getDocs(teacherQuery);
        }
        else {
            // 관리자는 모든 허가원을 볼 수 있음
            querySnapshot = await getDocs(permissionSlipsRef);
        }

        const permissionSlips = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 클라이언트 사이드에서 정렬 처리
        permissionSlips.sort((a, b) => {
            const aTime = (a as { createdAt?: { seconds: number } }).createdAt?.seconds || 0;
            const bTime = (b as { createdAt?: { seconds: number } }).createdAt?.seconds || 0;
            return bTime - aTime;
        });

        return NextResponse.json(permissionSlips);
    } catch (error) {
        console.error('Error fetching permission slips:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { location, students, reason, assignedTeacher, userEmail, userName, periods } = await request.json();

        if (!location || !students || !reason || !assignedTeacher) {
            return NextResponse.json({ error: 'Location, students, reason, and assigned teacher are required' }, { status: 400 });
        }

        if (!Array.isArray(students) || students.length === 0) {
            return NextResponse.json({ error: 'At least one student must be specified' }, { status: 400 });
        }

        if (students.length > 20) {
            return NextResponse.json({ error: 'Maximum 20 students allowed' }, { status: 400 });
        }

        // 학생 정보 유효성 검사
        for (const student of students) {
            if (!student.name || !student.studentId) {
                return NextResponse.json({ error: 'All students must have name and student ID' }, { status: 400 });
            }
        }

        if (reason.trim() === '') {
            return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
        }

        const newPermissionSlip = {
            studentEmail: userEmail || 'student@test.com',
            studentName: userName || '김학생',
            location,
            students,
            reason: reason.trim(),
            assignedTeacher: assignedTeacher,
            periods: periods || [],
            status: 'pending' as PermissionSlipStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Firestore에 저장
        const permissionSlipsRef = collection(db, 'permissionSlips');
        const docRef = await addDoc(permissionSlipsRef, newPermissionSlip);

        // 담당 선생님에게 알림 전송
        try {
            const periodsText = Array.isArray(periods) && periods.length > 0
                ? `${periods.length}교시 (${periods.join(', ')})`
                : '교시 정보 없음';
            const studentCountText = `총 ${students.length}명`;

            const notificationTitle = '📋 새로운 허가원이 도착했습니다';
            const notificationBody = `${userName}님이 허가원을 제출했습니다.\n📍 장소: ${location}\n🕐 시간: ${periodsText}\n👥 학생수: ${studentCountText}\n📝 사유: ${reason}`;

            // 알림 전송 API 호출
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: assignedTeacher,
                    title: notificationTitle,
                    body: notificationBody,
                    data: {
                        type: 'permission-slip-submitted',
                        slipId: docRef.id,
                        studentName: userName || '학생',
                        location: location
                    }
                }),
            });
        } catch (notificationError) {
            console.error('Error sending notification to teacher:', notificationError);
            // 알림 전송 실패해도 허가원 생성은 성공으로 처리
        }

        return NextResponse.json({
            id: docRef.id,
            ...newPermissionSlip,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error('Error creating permission slip:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}