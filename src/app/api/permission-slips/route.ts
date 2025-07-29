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

        let permissionSlips = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 클라이언트 사이드에서 정렬 처리
        permissionSlips.sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
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
        const { location, students, reason, assignedTeacher, userEmail, userName } = await request.json();

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
            status: 'pending' as PermissionSlipStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        // Firestore에 저장
        const permissionSlipsRef = collection(db, 'permissionSlips');
        const docRef = await addDoc(permissionSlipsRef, newPermissionSlip);

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