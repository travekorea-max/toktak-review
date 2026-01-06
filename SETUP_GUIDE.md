# 톡톡리뷰 설정 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. https://supabase.com 접속 후 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `toktak-review`
   - Database Password: 안전한 비밀번호 입력 (꼭 기록해두세요)
   - Region: `Northeast Asia (Seoul)` 선택 (한국 서비스용)
4. "Create new project" 클릭 후 프로젝트 생성 대기 (약 2분)

### 1.2 환경 변수 설정
1. Supabase 프로젝트 대시보드에서 Settings > API로 이동
2. 다음 값들을 복사:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

3. `.env.local` 파일 업데이트:
```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_key_입력
```

## 2. 데이터베이스 스키마 적용

### 2.1 SQL Editor에서 스키마 생성
1. Supabase 대시보드에서 SQL Editor로 이동
2. "New Query" 클릭

#### Step 1: 기본 스키마 생성
1. `supabase/schema.sql` 파일의 전체 내용을 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭하여 실행
4. 성공 메시지 확인 (Success. No rows returned)

#### Step 2: Auth 연동 및 Storage 설정
1. `supabase/auth-sync.sql` 파일의 전체 내용을 복사
2. 새로운 쿼리 창에 붙여넣기
3. "Run" 버튼 클릭하여 실행
4. 성공 메시지 확인

### 2.2 테이블 확인
1. Table Editor로 이동
2. 다음 테이블들이 생성되었는지 확인:
   - users
   - reviewer_profiles
   - client_profiles
   - campaigns
   - campaign_images
   - applications
   - purchase_verifications
   - review_submissions
   - point_transactions
   - withdrawal_requests
   - client_deposits
   - notifications
   - categories
   - settings

### 2.3 Storage 버킷 확인
1. Storage로 이동
2. 다음 버킷들이 생성되었는지 확인:
   - campaign-images (public)
   - purchase-verifications (private)
   - review-images (private)

## 3. 관리자 계정 생성

### 3.1 첫 번째 사용자를 관리자로 설정
1. 개발 서버 실행: `npm run dev`
2. http://localhost:3000/auth/register 접속
3. 리뷰어로 회원가입 (이메일/비밀번호 입력)

### 3.2 SQL Editor에서 관리자 권한 부여
```sql
-- 방금 가입한 사용자의 이메일로 조회
SELECT id, email, role FROM users WHERE email = '가입한_이메일@example.com';

-- 해당 사용자를 관리자로 변경
UPDATE users
SET role = 'admin'
WHERE email = '가입한_이메일@example.com';
```

### 3.3 관리자 페이지 접속
1. 로그아웃 후 다시 로그인
2. http://localhost:3000/admin/dashboard 접속하여 관리자 페이지 확인

## 4. 애플리케이션 실행

### 4.1 개발 서버 실행
```bash
npm run dev
```

### 4.2 접속 가능한 페이지

#### 인증 페이지 (누구나 접속 가능)
- `/auth/login` - 로그인
- `/auth/register` - 회원가입 유형 선택
- `/auth/register/reviewer` - 리뷰어 회원가입
- `/auth/register/client` - 업체 회원가입

#### 리뷰어 페이지 (role='reviewer' 필요)
- `/reviewer/campaigns` - 캠페인 목록
- `/reviewer/campaigns/[id]` - 캠페인 상세
- `/reviewer/campaigns/[id]/apply` - 캠페인 신청
- `/reviewer/my-activities` - 내 활동
- `/reviewer/my-activities/[id]` - 활동 상세
- `/reviewer/my-activities/[id]/purchase-verify` - 구매 인증
- `/reviewer/my-activities/[id]/review-submit` - 리뷰 제출
- `/reviewer/points` - 포인트 내역
- `/reviewer/points/withdraw` - 포인트 출금
- `/reviewer/mypage` - 마이페이지
- `/reviewer/mypage/profile` - 프로필 수정
- `/reviewer/mypage/account` - 계정 정보
- `/reviewer/mypage/settings` - 설정

#### 업체 페이지 (role='client' 필요)
- `/client/dashboard` - 대시보드
- `/client/campaigns` - 캠페인 관리
- `/client/campaigns/new` - 캠페인 생성
- `/client/campaigns/[id]` - 캠페인 상세
- `/client/campaigns/[id]/applicants` - 지원자 관리
- `/client/settlements` - 정산 내역
- `/client/settings` - 설정

#### 관리자 페이지 (role='admin' 필요)
- `/admin/dashboard` - 대시보드
- `/admin/campaigns` - 캠페인 승인 관리
- `/admin/campaigns/[id]` - 캠페인 승인 상세
- `/admin/users` - 사용자 관리
- `/admin/reviews` - 리뷰 검수

## 5. 테스트 데이터 생성 (선택사항)

### 5.1 테스트 계정 생성
실제 회원가입 페이지를 통해 다음 계정들을 생성하면 테스트하기 편리합니다:

1. 관리자 계정 (위에서 생성)
2. 리뷰어 계정 2-3개
3. 업체 계정 1-2개

### 5.2 테스트 캠페인 생성
1. 업체 계정으로 로그인
2. `/client/campaigns/new`에서 캠페인 생성
3. 관리자 계정으로 로그인하여 캠페인 승인
4. 리뷰어 계정으로 캠페인 신청 테스트

## 6. 문제 해결

### 6.1 "Invalid supabaseUrl" 에러
- `.env.local` 파일의 URL이 올바른지 확인
- URL이 `https://`로 시작하는지 확인
- Supabase 프로젝트가 정상적으로 생성되었는지 확인

### 6.2 "User not found" 에러
- Auth 트리거가 정상적으로 생성되었는지 확인
- `auth-sync.sql` 스크립트를 다시 실행

### 6.3 RLS 정책 에러
- SQL Editor에서 RLS 정책이 정상적으로 생성되었는지 확인
- `schema.sql` 스크립트를 다시 실행

### 6.4 이미지 업로드 에러
- Storage 버킷이 생성되었는지 확인
- Storage 정책이 정상적으로 생성되었는지 확인
- `auth-sync.sql` 스크립트를 다시 실행

## 7. 다음 단계

### 7.1 구현되지 않은 기능
현재 프론트엔드 UI는 완성되었지만, 다음 기능들은 추가 구현이 필요합니다:

1. **이미지 업로드**: Supabase Storage 연동
   - 캠페인 이미지 업로드
   - 구매 인증 이미지 업로드
   - 리뷰 이미지 업로드

2. **AI 리뷰 검수**: OpenAI API 연동
   - 리뷰 텍스트 분석
   - 필수 키워드 포함 여부 확인
   - 리뷰 품질 점검

3. **알림 시스템**: 실시간 알림
   - 캠페인 승인/거절 알림
   - 지원자 선정 알림
   - 리뷰 승인/거절 알림

4. **결제 시스템**: 포트원(구 아임포트) 연동
   - 업체 보증금 결제
   - 리뷰어 포인트 출금

5. **이메일 인증**: Supabase Auth Email 설정
   - 회원가입 이메일 인증
   - 비밀번호 재설정

### 7.2 배포
```bash
# Vercel 배포
npm install -g vercel
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 8. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
