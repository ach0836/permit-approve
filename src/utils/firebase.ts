// Firebase Timestamp를 JavaScript Date로 변환하는 유틸리티 함수

export function convertFirebaseTimestamp(timestamp: any): Date {
    if (!timestamp) {
        return new Date();
    }

    // Firebase Timestamp 객체인 경우
    if (timestamp.seconds !== undefined) {
        return new Date(timestamp.seconds * 1000);
    }

    // 이미 Date 객체이거나 유효한 날짜 문자열인 경우
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // 변환할 수 없는 경우 현재 시간 반환
    return new Date();
}

export function convertPermissionSlipData(slip: any) {
    return {
        ...slip,
        createdAt: convertFirebaseTimestamp(slip.createdAt),
        updatedAt: convertFirebaseTimestamp(slip.updatedAt),
        processedBy: slip.processedBy ? {
            ...slip.processedBy,
            processedAt: convertFirebaseTimestamp(slip.processedBy.processedAt)
        } : undefined
    };
}
