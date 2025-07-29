# 디지털 외출허가서 시스템

Next.js 기반의 역할별 디지털 외출허가서 관리 시스템입니다.

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env` 파일을 참조하여 필요한 환경변수를 설정하세요.

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드 및 배포
```bash
npm run build
npm start
```

## 📚 상세 가이드

시스템 유지보수에 대한 자세한 내용은 [`MAINTENANCE_GUIDE.md`](./MAINTENANCE_GUIDE.md)를 참조하세요.

## 🔑 주요 기능

### 역할 기반 액세스 제어
- **학생**: 허가원 제출 및 상태 확인
- **교사**: 대기중인 허가원 승인/반려 처리  
- **관리자**: 전체 허가원 관리 및 사용자 역할 설정

### 🎯 자동 역할 할당
시스템은 Google 로그인 시 이메일 주소를 기반으로 자동으로 역할을 할당합니다:
- **선생님 이메일**: `.env` 파일의 `TEACHER_EMAILS`에 등록된 이메일
- **관리자 이메일**: `.env` 파일의 `ADMIN_EMAILS`에 등록된 이메일  
- **기본값**: 등록되지 않은 이메일은 자동으로 '학생' 역할

### 핵심 기능
- Google OAuth 인증
- 실시간 데이터 동기화
- 반응형 UI (DaisyUI)
- 타입스크립트 완전 지원

## 🛠 기술 스택

- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **인증**: NextAuth.js (Google Provider)
- **데이터베이스**: Firebase Firestore
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS + DaisyUI
- **유틸리티**: Lodash, date-fns

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 `.env.local`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env.local
```

필요한 환경 변수:
- `NEXTAUTH_URL`: 애플리케이션 URL
- `NEXTAUTH_SECRET`: NextAuth 암호화 키
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth 설정
- `TEACHER_EMAILS`: 선생님으로 자동 할당할 이메일 목록 (쉼표로 구분)
- `ADMIN_EMAILS`: 관리자로 자동 할당할 이메일 목록 (쉼표로 구분)
- Firebase 설정 변수들

### 역할 자동 할당 설정 예시
```env
TEACHER_EMAILS=kim.teacher@school.com,lee.teacher@school.com,park.teacher@school.com
ADMIN_EMAILS=admin@school.com,principal@school.com
```

### 3. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000에서 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── api/               # API 라우트
│   ├── auth/              # 인증 페이지
│   └── dashboard/         # 대시보드 페이지
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 외부 서비스 설정
├── store/                 # Zustand 상태 관리
├── types/                 # TypeScript 타입 정의
└── utils/                 # 유틸리티 함수
```

## 🔧 설정 가이드

### Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI 추가: `http://localhost:3000/api/auth/callback/google`

### Firebase 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Firestore 데이터베이스 생성
3. 웹 앱 등록 후 설정 정보 복사

## 📊 데이터베이스 구조

### users 컬렉션
```typescript
{
  email: string;        // 문서 ID로도 사용
  name: string;
  image?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### permissionSlips 컬렉션
```typescript
{
  studentEmail: string;
  studentName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  processedBy?: {
    email: string;
    name: string;
    processedAt: Date;
  };
}
```

## 🎨 UI 컴포넌트

DaisyUI를 기반으로 한 반응형 UI 컴포넌트들:
- 로그인 화면
- 역할별 대시보드
- 허가원 제출/관리 폼
- 사용자 관리 테이블

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
