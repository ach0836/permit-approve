# 디지털 외출허가서 시스템 유지보수 가이드

## 📋 시스템 개요
- **프레임워크**: Next.js 14+ with App Router
- **언어**: TypeScript (strict mode)
- **인증**: NextAuth.js with Google OAuth
- **데이터베이스**: Firebase Firestore
- **상태관리**: Zustand
- **스타일링**: Tailwind CSS + DaisyUI

## 🔧 자주 수정하는 항목들

### 1. 새로운 선생님 추가하기

새로운 선생님을 시스템에 추가할 때는 **3곳**을 모두 업데이트해야 합니다:

#### ① `.env` 파일 (자동 역할 할당)
```bash
# 기존 목록에 새 선생님 이메일 추가 (쉼표로 구분)
TEACHER_EMAILS=gcy000515@gmail.com,kim.teacher@school.com,new.teacher@school.com
```

#### ② `src/types/index.ts` (UI 선택 목록)
```typescript
export const TEACHERS = [
    { email: 'gcy000515@gmail.com', name: '강채영 선생님' },
    { email: 'kim.teacher@school.com', name: '김선생님' },
    { email: 'new.teacher@school.com', name: '신규선생님' }, // 새로 추가
] as const;
```

#### ③ `src/lib/auth.ts` (백업 목록)
```typescript
// determineUserRole 함수 내의 teacherEmails 배열에 추가
const teacherEmails = process.env.TEACHER_EMAILS?.split(',').map(e => e.trim()) || [
    'gcy000515@gmail.com',
    'kim.teacher@school.com',
    'new.teacher@school.com', // 새로 추가
    // ...
];
```

### 2. 새로운 장소 추가하기

`src/types/index.ts`의 `LOCATIONS` 배열만 수정하면 됩니다:

```typescript
export const LOCATIONS = [
    // 기존 장소들...
    '새로운실험실', // 새로 추가
] as const;
```

### 3. 관리자 추가하기

`.env` 파일의 `ADMIN_EMAILS`에 추가:
```bash
ADMIN_EMAILS=ach080306@gmail.com,new.admin@school.com
```

## 🗂️ 파일 구조 및 역할

### 핵심 설정 파일
- **`.env`**: 환경변수 (OAuth, Firebase, 역할 할당)
- **`src/lib/auth.ts`**: NextAuth 설정 및 자동 역할 할당 로직
- **`src/types/index.ts`**: TypeScript 타입 정의 및 상수 데이터

### 컴포넌트 파일
- **`src/components/StudentDashboard.tsx`**: 학생 대시보드
- **`src/components/TeacherDashboard.tsx`**: 선생님 대시보드
- **`src/components/AdminDashboard.tsx`**: 관리자 대시보드

### 유틸리티 파일
- **`src/lib/firebase.ts`**: Firebase 설정
- **`src/utils/roleUtils.ts`**: 역할 관련 유틸리티 함수

## 🔄 역할 할당 시스템

### 자동 역할 할당 순서
1. **관리자**: `ADMIN_EMAILS`에 포함된 이메일
2. **선생님**: `TEACHER_EMAILS`에 포함된 이메일  
3. **학생**: 위 목록에 없는 모든 이메일 (기본값)

### 역할 변경 방법
1. 환경변수에서 이메일 목록 수정
2. 해당 사용자가 다시 로그인하면 자동으로 역할 업데이트

## 🚀 배포 시 체크리스트

### 보안 설정
- [ ] `.env` 파일을 `.gitignore`에 포함
- [ ] 프로덕션 환경에서 `NEXTAUTH_URL`을 HTTPS로 변경
- [ ] Google OAuth 클라이언트 시크릿 재발급
- [ ] Firebase 보안 규칙 검토

### 기능 테스트
- [ ] 학생/선생님/관리자 각 역할별 로그인 테스트
- [ ] 외출신청서 제출/승인/거부 플로우 테스트
- [ ] 모바일 반응형 UI 테스트

## 🐛 문제 해결

### 역할이 올바르게 할당되지 않는 경우
1. `.env` 파일의 이메일 목록 확인
2. 사용자 로그아웃 후 재로그인
3. Firebase Console에서 `users` 컬렉션 확인

### 선생님 목록이 UI에 표시되지 않는 경우
1. `src/types/index.ts`의 `TEACHERS` 배열 확인
2. 애플리케이션 재시작

### Firebase 연결 오류
1. Firebase 프로젝트 설정 확인
2. `.env` 파일의 Firebase 환경변수 확인
3. Firebase 보안 규칙 검토

## 📞 지원

추가 문의사항이나 문제가 발생하면 개발팀에 연락하세요.
