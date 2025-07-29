# Firebase Security Rules

다음 규칙을 Firebase Console에서 설정해주세요:

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
      allow read: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role in ['teacher', 'admin']);
    }
    
    // Permission slips collection
    match /permissionSlips/{slipId} {
      // Students can create and read their own slips
      allow create: if request.auth != null && 
        request.auth.token.email == request.resource.data.studentEmail;
      
      allow read: if request.auth != null && (
        // Student can read their own slips
        request.auth.token.email == resource.data.studentEmail ||
        // Teacher can read assigned slips
        (get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'teacher' &&
         request.auth.token.email == resource.data.assignedTeacher) ||
        // Admin can read all slips
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin'
      );
      
      // Teachers can update assigned slips, admins can update all
      allow update: if request.auth != null && (
        (get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'teacher' &&
         request.auth.token.email == resource.data.assignedTeacher) ||
        get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'admin'
      );
    }
  }
}
```

## 설정 방법

1. Firebase Console → Firestore Database → Rules 탭
2. 위의 규칙을 복사하여 붙여넣기
3. "게시" 버튼 클릭

이 규칙들은 다음을 보장합니다:
- 학생은 자신의 허가원만 조회/생성 가능
- 선생님은 자신에게 할당된 허가원만 조회/수정 가능
- 관리자는 모든 데이터에 접근 가능
- 사용자는 자신의 프로필만 수정 가능
