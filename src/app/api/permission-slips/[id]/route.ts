import { NextRequest, NextResponse } from 'next/server';
import { PermissionSlipStatus } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { status, userEmail, userName } = await request.json();

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // 허가원 문서 참조
        const slipRef = doc(db, 'permissionSlips', params.id);
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating permission slip:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
