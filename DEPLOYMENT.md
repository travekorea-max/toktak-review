# 톡톡리뷰 배포 가이드

## 1. 필수 준비 사항

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 접속 후 새 프로젝트 생성
2. Project Settings > API에서 다음 정보 확인:
   - Project URL
   - anon public key
   - service_role key (서버용)

### 1.2 Supabase 데이터베이스 설정
1. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
2. Storage에서 다음 버킷 생성 (Public 설정):
   - `campaign-images`
   - `verification-images`
   - `review-screenshots`
   - `profile-images`

### 1.3 토스페이먼츠 설정
1. [토스페이먼츠](https://developers.tosspayments.com) 가입
2. 테스트 모드에서 개발 후 실결제 전환
3. 필요한 키:
   - 클라이언트 키 (프론트엔드)
   - 시크릿 키 (백엔드)

### 1.4 이메일 발송 (Resend)
1. [Resend](https://resend.com) 가입
2. API 키 발급
3. 도메인 인증 (실서비스 시)

---

## 2. 환경변수 설정

### 2.1 로컬 개발 (.env.local)
\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

# 이메일 (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SMS (선택 - 개발시 콘솔 출력)
SMS_API_KEY=
SMS_SENDER=
\`\`\`

### 2.2 프로덕션 환경변수
Vercel Dashboard > Settings > Environment Variables에 추가

---

## 3. Vercel 배포

### 3.1 GitHub 연결
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/toktak-review.git
git push -u origin main
\`\`\`

### 3.2 Vercel 배포
1. [Vercel](https://vercel.com) 로그인
2. "Import Project" 클릭
3. GitHub 저장소 선택
4. 환경변수 설정
5. Deploy 클릭

---

## 4. 체크리스트

### 배포 전 확인
- [ ] 모든 환경변수 설정 완료
- [ ] Supabase DB 마이그레이션 완료
- [ ] Storage 버킷 생성 및 권한 설정
- [ ] 토스페이먼츠 실결제 키 설정
- [ ] 이메일 도메인 인증 (Resend)

### 배포 후 확인
- [ ] 회원가입/로그인 테스트
- [ ] 캠페인 등록 테스트
- [ ] 결제 테스트
- [ ] 이메일 발송 테스트
- [ ] 모바일 반응형 확인

---

## 5. 문제 해결

### 자주 발생하는 문제
1. **빌드 실패**: 환경변수 확인
2. **DB 연결 실패**: Supabase URL/키 확인
3. **이미지 업로드 실패**: Storage 버킷 권한 확인
4. **결제 실패**: 토스페이먼츠 키 확인
