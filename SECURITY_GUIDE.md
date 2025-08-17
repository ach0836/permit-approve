# 🔐 보안 가이드

## 🚨 발견된 보안 문제 및 해결 사항

### 1. **Critical Issues (해결됨)**

#### ❌ **Service Worker에 Firebase 키 하드코딩**
- **문제**: 클라이언트에서 접근 가능한 민감한 설정
- **해결**: 동적 설정 로딩 및 API 엔드포인트를 통한 안전한 배포

#### ❌ **에러 메시지에서 민감한 정보 노출**  
- **문제**: 상세한 에러 정보가 클라이언트에 노출
- **해결**: 프로덕션에서 일반적인 에러 메시지 반환

### 2. **Medium Issues (해결됨)**

#### ⚠️ **API 요청 검증 부족**
- **문제**: 입력 검증, XSS 방지, 인증 확인 미흡
- **해결**: 종합적인 입력 검증 및 XSS 방지 로직 추가

#### ⚠️ **보안 헤더 누락**
- **문제**: XSS, Clickjacking 등 공격에 취약
- **해결**: 포괄적인 보안 헤더 적용

## 🛡️ 적용된 보안 조치

### **1. 인증 및 권한 관리**
```typescript
// 세션 기반 API 보호
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### **2. 입력 검증 및 XSS 방지**
```typescript
// 길이 제한 및 특수 문자 검증
const dangerousChars = /<script|javascript:|data:|vbscript:/i;
if (dangerousChars.test(title) || dangerousChars.test(body)) {
    return 'Invalid characters detected';
}

// HTML 태그 제거
const sanitizedTitle = title.replace(/<[^>]*>/g, '').substring(0, 100);
```

### **3. 보안 헤더 설정**
```typescript
// XSS 보호
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');

// CSP 설정
const csp = "default-src 'self'; script-src 'self' https://trusted-domain.com";
response.headers.set('Content-Security-Policy', csp);
```

### **4. URL 및 경로 검증**
```typescript
// 안전한 URL만 허용
if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
    const allowedPaths = ['/dashboard', '/auth/signin', '/'];
    if (allowedPaths.some(path => targetUrl.startsWith(path))) {
        safeUrl = targetUrl;
    }
}
```

### **5. 에러 정보 보호**
```typescript
// 프로덕션에서 에러 정보 숨김
const isDevelopment = process.env.NODE_ENV === 'development';
const errorMessage = isDevelopment && error instanceof Error ? 
    error.message : 'Internal server error';
```

## 🔒 환경변수 관리

### **중요한 환경변수**
```bash
# 🔑 절대 공개하면 안 되는 키들
NEXTAUTH_SECRET=               # 32자 이상 랜덤 문자열
GOOGLE_CLIENT_SECRET=          # Google OAuth 비밀키  
FIREBASE_SERVICE_ACCOUNT_KEY=  # Firebase 관리자 키

# 📋 공개되어도 비교적 안전한 키들 (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=      # Firebase 공개 키
NEXT_PUBLIC_FIREBASE_PROJECT_ID=   # 프로젝트 ID
```

### **보안 체크리스트**

#### ✅ **개발 환경**
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] 모든 시크릿 키가 환경변수로 관리됨
- [ ] 개발용 키와 프로덕션 키가 분리됨

#### ✅ **프로덕션 환경**  
- [ ] HTTPS 강제 설정
- [ ] 보안 헤더 모두 적용
- [ ] CSP 정책 활성화
- [ ] 에러 로깅 시스템 구축
- [ ] 정기적인 키 교체 계획

#### ✅ **Firebase 보안**
- [ ] Firestore 보안 규칙 설정
- [ ] Firebase 프로젝트 IAM 권한 최소화
- [ ] FCM 토큰 유효성 검증

## 🚀 배포 전 보안 점검

### **1. 코드 검토**
```bash
# 하드코딩된 시크릿 검색
grep -r "AIza\|GOCSPX\|firebase\|secret" src/ --exclude-dir=node_modules

# TODO/FIXME 마커 확인  
grep -r "TODO\|FIXME\|XXX" src/ --exclude-dir=node_modules
```

### **2. 의존성 취약점 검사**
```bash
npm audit
npm audit fix
```

### **3. 환경변수 검증**
```bash
# 모든 필수 환경변수가 설정되었는지 확인
node -e "console.log(process.env.NEXTAUTH_SECRET ? '✅' : '❌', 'NEXTAUTH_SECRET')"
```

## 📞 보안 사고 대응

### **즉시 조치사항**
1. 영향받은 시스템 격리
2. 모든 API 키 및 시크릿 즉시 교체
3. 사용자 로그아웃 강제 실행
4. 로그 분석 및 피해 범위 파악

### **예방 조치**
- 정기적인 보안 점검 (월 1회)
- 의존성 업데이트 (주 1회)  
- 침투 테스트 (분기 1회)
- 보안 교육 및 가이드라인 업데이트

## 🔗 추가 참고자료

- [OWASP Top 10](https://owasp.org/Top10/)
- [Next.js 보안 가이드](https://nextjs.org/docs/advanced-features/security-headers)
- [Firebase 보안 규칙](https://firebase.google.com/docs/rules)
- [Google OAuth 보안](https://developers.google.com/identity/protocols/oauth2/web-server#security-considerations)
