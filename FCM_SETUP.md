# Firebase Cloud Messaging (FCM) 설정 가이드

## 1. Firebase 콘솔에서 설정

### 1.1 Cloud Messaging 활성화
1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택 (`permit-2469e`)
3. 좌측 메뉴에서 "Cloud Messaging" 클릭
4. "시작하기" 또는 "활성화" 클릭

### 1.2 웹 푸시 인증서 생성
1. Cloud Messaging 페이지에서 "Web configuration" 탭 클릭
2. "Generate key pair" 버튼 클릭
3. 생성된 VAPID Key를 복사
4. `.env.local` 파일의 `NEXT_PUBLIC_FIREBASE_VAPID_KEY`에 설정

### 1.3 서비스 계정 키 생성
1. Firebase 콘솔에서 "프로젝트 설정" (톱니바퀴 아이콘) 클릭
2. "서비스 계정" 탭 클릭
3. "새 비공개 키 생성" 버튼 클릭
4. JSON 파일 다운로드
5. JSON 내용을 한 줄로 변환하여 `.env.local`의 `FIREBASE_SERVICE_ACCOUNT_KEY`에 설정

## 2. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```bash
# FCM VAPID Key (Firebase 콘솔에서 생성)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE

# Firebase 서비스 계정 키 (JSON을 한 줄로 변환)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## 3. 도메인 허용 설정

### 3.1 Firebase 콘솔에서 도메인 추가
1. Firebase 콘솔 > Authentication > Settings > Authorized domains
2. 배포할 도메인 추가 (예: `your-domain.com`)

### 3.2 FCM을 위한 도메인 설정
1. Cloud Messaging > Web configuration
2. 도메인 허용 목록에 배포 도메인 추가

## 4. 테스트 방법

### 4.1 로컬 테스트
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 알림 권한 허용
3. 다른 사용자로 로그인하여 허가원 승인/반려 테스트

### 4.2 알림 확인
- **포그라운드**: 화면 우측 상단에 알림 표시
- **백그라운드**: 브라우저 기본 알림으로 표시 (탭이 비활성화된 상태)
- **백그라운드 알림 조건**:
  - 브라우저 탭이 백그라운드에 있거나 최소화된 상태
  - 알림 권한이 허용된 상태
  - 서비스 워커가 정상 등록된 상태

### 4.3 백그라운드 알림 테스트
1. 허가원 시스템에 로그인 후 알림 권한 허용
2. 브라우저 탭을 다른 탭으로 전환하거나 최소화
3. 다른 기기/브라우저에서 허가원 제출 또는 승인/거절
4. 백그라운드 알림이 시스템 알림으로 표시되는지 확인
5. 알림 클릭 시 대시보드로 이동하는지 확인

## 5. 배포 시 주의사항

### 5.1 HTTPS 필수
- FCM은 HTTPS에서만 동작
- 로컬 개발 시에는 localhost에서 테스트 가능

### 5.2 서비스 워커
- `firebase-messaging-sw.js` 파일이 루트 경로에 위치해야 함
- 브라우저 캐시 문제 시 하드 리프레시 필요

### 5.3 브라우저 호환성
- Chrome, Firefox, Safari (iOS 16.4+) 지원
- 모바일 브라우저에서도 동작

## 6. 문제해결

### 6.1 알림이 안 오는 경우
1. **브라우저 알림 권한 확인**
   - 브라우저 설정에서 사이트 알림 권한 확인
   - 시스템 알림 설정 확인 (Windows/Mac 알림 센터)
2. **Firebase 콘솔에서 토큰 등록 상태 확인**
3. **네트워크 탭에서 API 호출 결과 확인**
4. **서비스 워커 등록 상태 확인**
   - 개발자 도구 > Application > Service Workers
   - `/firebase-messaging-sw.js` 파일이 등록되어 있는지 확인

### 6.2 백그라운드 알림 문제해결
1. **서비스 워커 강제 새로고침**
   - 개발자 도구 > Application > Service Workers > Update
   - 브라우저 하드 리프레시 (Ctrl+Shift+R)
2. **HTTPS 환경 확인**
   - 로컬: localhost는 HTTP여도 작동
   - 배포: 반드시 HTTPS 필요
3. **브라우저별 차이점**
   - Chrome: 가장 안정적
   - Firefox: 일부 기능 제한 있을 수 있음
   - Safari: iOS 16.4+ 에서만 지원

### 6.2 토큰 관련 오류
- FCM 토큰은 주기적으로 갱신됨
- 앱 재설치 시 새 토큰 생성
- 토큰 저장/업데이트 로직 확인

## 7. 보안 고려사항

1. 서비스 계정 키는 절대 클라이언트에 노출하지 않기
2. VAPID Key는 공개되어도 상대적으로 안전하지만 관리 필요
3. 알림 내용에 민감한 정보 포함하지 않기
4. 사용자 토큰 정보 안전하게 저장

## 8. 향후 개선사항

1. 알림 구독/해제 기능
2. 알림 히스토리 관리
3. 개인화된 알림 설정
4. 다양한 알림 타입 (긴급, 일반 등)
5. 알림 통계 및 분석
