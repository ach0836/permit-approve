import { NextRequest, NextResponse } from 'next/server';
import { PermissionSlipStatus } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status, userEmail, userName } = await request.json();

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // 허가원 문서 참조
        const slipRef = doc(db, 'permissionSlips', id);
        const slipDoc = await getDoc(slipRef);

        if (!slipDoc.exists()) {
            return NextResponse.json({ error: 'Permission slip not found' }, { status: 404 });
        }

        const slipData = slipDoc.data();

        // 이미 처리된 허가원인지 확인
        if (slipData.status !== 'pending') {
            return NextResponse.json({ error: 'Permission slip already processed' }, { status: 400 });
        }

        // 상태 업데이트
        const updateData = {
            status: status as PermissionSlipStatus,
            updatedAt: serverTimestamp(),
            processedBy: {
                email: userEmail || 'teacher@school.com',
                name: userName || '선생님',
                processedAt: serverTimestamp(),
            },
        };

        await updateDoc(slipRef, updateData);

        // 학생에게 알림 전송
        try {
            const notificationTitle = status === 'approved' ? '✅ 허가원 승인 완료!' : '❌ 허가원 반려';
            const notificationBody = status === 'approved'
                ? `${slipData.location} 허가원이 승인되었습니다. 해당 장소로 이동하세요.`
                : `${slipData.location} 허가원이 반려되었습니다. 자세한 내용은 담당 선생님께 문의하세요.`;            // 알림 전송 API 호출
            await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: slipData.studentEmail,
                    title: notificationTitle,
                    body: notificationBody,
                    data: {
                        type: 'permission-slip',
                        slipId: id,
                        status: status
                    }
                }),
            });
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // 알림 전송 실패해도 허가원 상태 업데이트는 성공으로 처리
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating permission slip:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
