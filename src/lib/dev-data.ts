// 개발용 메모리 데이터 저장소
export const permissionSlips: Array<Record<string, unknown>> = [];
let nextId = 1;

// ID 생성 함수
export function getNextId(): string {
    return (nextId++).toString();
}

// 데이터 저장소 초기화 (개발용 샘플 데이터)
export function initializeSampleData() {
    if (permissionSlips.length === 0) {
        // 샘플 데이터 추가
        permissionSlips.push({
            id: '1',
            studentEmail: 'student@test.com',
            studentName: '김학생',
            location: '학교 앞 편의점',
            students: [
                { name: '김학생', studentId: '2024001' },
                { name: '이학생', studentId: '2024002' }
            ],
            reason: '간식 구매',
            status: 'pending',
            createdAt: new Date(Date.now() - 60000 * 30), // 30분 전
            updatedAt: new Date(Date.now() - 60000 * 30),
        });

        permissionSlips.push({
            id: '2',
            studentEmail: 'student@test.com',
            studentName: '김학생',
            location: '학교 근처 문구점',
            students: [
                { name: '박학생', studentId: '2024003' }
            ],
            reason: '필기구 구매',
            status: 'approved',
            createdAt: new Date(Date.now() - 60000 * 60), // 1시간 전
            updatedAt: new Date(Date.now() - 60000 * 30),
            processedBy: {
                email: 'teacher@test.com',
                name: '김선생',
                processedAt: new Date(Date.now() - 60000 * 30)
            }
        });

        nextId = 3;
    }
}
