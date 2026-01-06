# 톡톡리뷰 배포 - 완전 초보자 가이드

## 사전 준비물
- [x] 프로젝트 폴더: `C:\Users\trave\toktak-review`
- [ ] 이메일 주소 (Gmail, Naver 등 아무거나)
- [ ] Supabase 프로젝트 생성 완료 (SETUP_GUIDE.md 참조)

## Step 1: Node.js 버전 확인

```bash
node -v
```

**출력 예시:** `v20.x.x` 또는 `v18.x.x`
- 18 이상이면 OK
- 18 미만이면 Node.js 업데이트 필요

---

## Step 2: 프로젝트 빌드 테스트

```bash
cd C:\Users\trave\toktak-review
npm run build
```

**성공하면:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (30/30)
✓ Finalizing page optimization
```

**에러가 나면:**
- 에러 메시지 복사해서 검색하거나
- 일단 무시하고 진행 (Vercel에서 다시 시도 가능)

---

## Step 3: Vercel CLI 설치

```bash
npm install -g vercel
```

**설치 확인:**
```bash
vercel --version
```

**출력 예시:** `Vercel CLI 33.0.1`

---

## Step 4: Vercel 로그인

```bash
vercel login
```

### 선택지가 나옵니다:

```
Vercel CLI 33.0.1
> Log in to Vercel
? Log in to Vercel
  Continue with GitHub
  Continue with GitLab
  Continue with Bitbucket
❯ Continue with Email
  ─────────────────────────
  Cancel
```

### 🎯 방법 A: 이메일로 로그인 (추천 - 제일 쉬움)

**1. "Continue with Email" 선택** (화살표 키로 이동, 엔터)

```
? Enter your email address:
```

**2. 이메일 주소 입력** (예: yourname@gmail.com)

```
> We sent an email to yourname@gmail.com
  Please follow the steps provided inside it and make sure
  the security code matches ABC DEF.
```

**3. 이메일 확인**
- 받은편지함 확인 (스팸함도 확인)
- "Verify your email for Vercel" 메일 열기
- 화면에 표시된 보안 코드와 메일 내용의 코드가 같은지 확인
- **"VERIFY"** 버튼 클릭

**4. 브라우저에서 확인**
- 자동으로 브라우저 열림
- "Authenticated!" 메시지 확인
- 브라우저 닫기

**5. 터미널 확인**
```
✔ Email confirmed
> Success! GitHub connected
> You are now logged in.
```

### 🎯 방법 B: GitHub으로 로그인

GitHub 계정이 있다면:

**1. "Continue with GitHub" 선택**

**2. 브라우저 자동 열림**
- GitHub에 로그인되어 있으면 바로 진행
- 로그인 안 되어 있으면 GitHub 아이디/비밀번호 입력

**3. Vercel 권한 승인**
- "Authorize Vercel" 버튼 클릭

**4. 완료**
```
> Success! GitHub connected
> You are now logged in.
```

---

## Step 5: 첫 배포 (Preview)

```bash
cd C:\Users\trave\toktak-review
vercel
```

### 질문들에 답변하기:

**Q1: Set up and deploy?**
```
? Set up and deploy "C:\Users\trave\toktak-review"? (Y/n)
```
**답변:** `Y` (엔터)

**Q2: Which scope?**
```
? Which scope do you want to deploy to?
❯ Your Name (your-email@gmail.com)
```
**답변:** 본인 계정 선택 (엔터)

**Q3: Link to existing project?**
```
? Link to existing project? (y/N)
```
**답변:** `N` (엔터)

**Q4: What's your project's name?**
```
? What's your project's name? (toktak-review)
```
**답변:** `toktak-review` 또는 원하는 이름 (엔터)

**Q5: In which directory?**
```
? In which directory is your code located? (.)
```
**답변:** 그냥 엔터 (현재 디렉토리)

**Q6: Want to modify settings?**
```
? Want to modify these settings? (y/N)
```
**답변:** `N` (엔터)

### 배포 진행 중:

```
🔗  Linked to your-name/toktak-review (created .vercel)
🔍  Inspect: https://vercel.com/...
✅  Preview: https://toktak-review-xxxxx.vercel.app [2s]
📝  Deployed to production. Run `vercel --prod` to overwrite later.
```

**중요:** 이건 테스트 배포(Preview)입니다. 실제 운영은 다음 단계에서!

---

## Step 6: 환경 변수 설정

### Supabase 정보 준비

먼저 Supabase 대시보드에서 확인:
1. https://supabase.com 로그인
2. 프로젝트 선택
3. Settings → API로 이동
4. 다음 두 값을 복사해두기:
   - **Project URL**: `https://abcdefghijk.supabase.co`
   - **anon public key**: `eyJhbGc...` (긴 문자열)

### Vercel에 환경 변수 추가

**① Supabase URL 추가:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

질문이 나옵니다:
```
? What's the value of NEXT_PUBLIC_SUPABASE_URL?
```
**답변:** Supabase Project URL 붙여넣기 (예: `https://abcdefghijk.supabase.co`)

```
? Add NEXT_PUBLIC_SUPABASE_URL to which Environments?
  (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)
❯ ◉ Production
  ◉ Preview
  ◉ Development
```
**답변:** 스페이스바로 모두 선택 (◉ 3개), 엔터

```
✅  Added Environment Variable NEXT_PUBLIC_SUPABASE_URL to Project toktak-review
```

**② Supabase Anon Key 추가:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

```
? What's the value of NEXT_PUBLIC_SUPABASE_ANON_KEY?
```
**답변:** Supabase anon public key 붙여넣기

```
? Add NEXT_PUBLIC_SUPABASE_ANON_KEY to which Environments?
❯ ◉ Production
  ◉ Preview
  ◉ Development
```
**답변:** 스페이스바로 모두 선택, 엔터

```
✅  Added Environment Variable NEXT_PUBLIC_SUPABASE_ANON_KEY to Project toktak-review
```

### 환경 변수 확인:
```bash
vercel env ls
```

출력:
```
Environment Variables for toktak-review
  NEXT_PUBLIC_SUPABASE_URL       (Production, Preview, Development)
  NEXT_PUBLIC_SUPABASE_ANON_KEY  (Production, Preview, Development)
```

---

## Step 7: 실제 배포 (Production)

```bash
vercel --prod
```

배포 진행:
```
🔍  Inspect: https://vercel.com/...
✅  Production: https://toktak-review.vercel.app [25s]
```

**완료!** 이제 `https://toktak-review.vercel.app`에서 사이트가 24/7 운영됩니다!

---

## Step 8: 배포 확인

### ① 브라우저에서 테스트

**1. 배포된 사이트 접속:**
```
https://toktak-review.vercel.app
```

**2. 로그인 페이지 접속:**
```
https://toktak-review.vercel.app/auth/login
```

**3. 회원가입 테스트:**
```
https://toktak-review.vercel.app/auth/register
```

### ② 회원가입 해보기

1. 리뷰어로 회원가입 선택
2. 이메일/비밀번호/이름 입력
3. 회원가입 버튼 클릭
4. 로그인 테스트

**에러가 나면:**
- Supabase 스키마가 제대로 실행되었는지 확인
- 환경 변수가 올바른지 확인
- Vercel 로그 확인: `vercel logs`

---

## Step 9: Supabase Redirect URL 설정

배포 후 꼭 해야 할 설정:

**1. Supabase 대시보드 이동**
- Authentication → URL Configuration

**2. Site URL 업데이트:**
```
https://toktak-review.vercel.app
```

**3. Redirect URLs 추가:**
```
https://toktak-review.vercel.app/**
```

**4. 저장**

---

## Step 10: 관리자 계정 만들기

**1. 사이트에서 리뷰어로 회원가입**
```
https://toktak-review.vercel.app/auth/register/reviewer
```

**2. Supabase SQL Editor에서 실행:**
```sql
-- 가입한 이메일 확인
SELECT id, email, role FROM users;

-- 관리자로 변경 (가입한 이메일 입력)
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';
```

**3. 로그아웃 후 다시 로그인**

**4. 관리자 페이지 접속:**
```
https://toktak-review.vercel.app/admin/dashboard
```

---

## 코드 수정 후 재배포

### 로컬에서 코드 수정 후:

```bash
# 프로젝트 폴더로 이동
cd C:\Users\trave\toktak-review

# 수정사항 확인
npm run dev

# 문제없으면 배포
vercel --prod
```

**약 30초 후 자동으로 업데이트됩니다!**

---

## 문제 해결

### ❌ "Error: Project not found"

**해결:**
```bash
cd C:\Users\trave\toktak-review
vercel link
```

### ❌ 빌드 에러

**로컬 테스트:**
```bash
npm run build
```

**에러 수정 후:**
```bash
vercel --prod
```

### ❌ "Invalid supabaseUrl"

**환경 변수 확인:**
```bash
vercel env ls
```

**잘못되었으면 삭제 후 재등록:**
```bash
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

### ❌ 로그인 안 됨

**Supabase Redirect URL 확인:**
- Supabase → Authentication → URL Configuration
- Redirect URLs에 배포 URL이 있는지 확인

### 🔍 로그 확인

**실시간 로그:**
```bash
vercel logs
```

**최근 배포 로그:**
```bash
vercel logs --follow
```

---

## 배포 완료 체크리스트

- [ ] `vercel login` 성공
- [ ] `vercel` (Preview) 배포 성공
- [ ] 환경 변수 2개 추가 완료
- [ ] `vercel --prod` (Production) 배포 성공
- [ ] 배포된 URL 접속 가능
- [ ] `/auth/login` 페이지 로드됨
- [ ] Supabase Redirect URL 설정 완료
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] 관리자 계정 생성 완료

---

## 다음 단계

✅ 배포 완료!

이제 할 수 있는 것:
1. 친구들에게 URL 공유
2. 실제 캠페인 생성 테스트
3. 피드백 받기
4. 기능 개선 및 재배포

---

## 도움이 필요하면

### Vercel 문서
- https://vercel.com/docs

### 이 프로젝트 가이드
- `README.md` - 프로젝트 개요
- `SETUP_GUIDE.md` - Supabase 설정
- `DEPLOYMENT.md` - 배포 상세 가이드

### 커뮤니티
- Next.js Discord: https://nextjs.org/discord
- Vercel Discord: https://vercel.com/discord
- Supabase Discord: https://discord.supabase.com
