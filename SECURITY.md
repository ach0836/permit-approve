# 🔒 보안 가이드

## ⚠️ 중요: OAuth 크리덴셜 보안

### 즉시 조치 사항

1. **Google Cloud Console에서 새 OAuth 2.0 클라이언트 ID 생성**
   - [Google Cloud Console](https://console.cloud.google.com/) 접속
   - "API 및 서비스" → "사용자 인증 정보"
   - 기존 OAuth 2.0 클라이언트 ID **삭제**
   - 새로운 OAuth 2.0 클라이언트 ID 생성

2. **승인된 리디렉션 URI 설정**
   ```
   개발용: http://localhost:3000/api/auth/callback/google
   프로덕션용: https://yourdomain.com/api/auth/callback/google
   ```

3. **새 크리덴셜로 .env 파일 업데이트**
   ```env
   GOOGLE_CLIENT_ID=새로운-클라이언트-ID
   GOOGLE_CLIENT_SECRET=새로운-클라이언트-시크릿
   ```

### 보안 모범 사례

#### ✅ 해야 할 것
- 환경변수를 사용하여 민감한 정보 저장
- `.env` 파일을 `.gitignore`에 포함
- HTTPS 사용 (프로덕션)
- 정기적으로 크리덴셜 교체
- NextAuth 디버그 로그 비활성화 (프로덕션)

#### ❌ 하지 말아야 할 것
- 크리덴셜을 코드에 하드코딩
- 로그에 민감한 정보 출력
- 공개 저장소에 `.env` 파일 커밋
- HTTP 사용 (프로덕션)

### 현재 보안 설정 상태

- ✅ **환경변수 사용**: `process.env`로 접근
- ✅ **JWT 암호화**: NextAuth에서 자동 처리
- ✅ **CSRF 보호**: `state` 파라미터 사용
- ✅ **PKCE 보안**: 코드 탈취 방지
- ✅ **디버그 로그 비활성화**: 민감한 정보 노출 방지
- ⚠️ **크리덴셜 교체 필요**: 노출된 시크릿 교체

### Firebase 보안 규칙

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 본인 정보만 읽기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // 허가원 접근 제어
    match /permissionSlips/{slipId} {
      allow read, write: if request.auth != null && (
        // 학생: 본인이 제출한 허가원만
        resource.data.studentEmail == request.auth.token.email ||
        // 교사: 할당된 허가원만
        resource.data.assignedTeacher == request.auth.token.email ||
        // 관리자: 모든 허가원
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin'
      );
    }
  }
}
```

### 프로덕션 배포 시 추가 보안 사항

1. **HTTPS 강제 사용**
2. **CSP (Content Security Policy) 헤더 설정**
3. **HSTS (HTTP Strict Transport Security) 활성화**
4. **환경변수 서버에서만 접근 가능하도록 설정**
5. **정기적인 보안 업데이트**

## 📞 보안 문제 발생 시

즉시 다음 조치를 취하세요:
1. 영향받은 크리덴셜 교체
2. 사용자에게 비밀번호 변경 권고
3. 보안 로그 점검
4. 필요시 서비스 일시 중단
