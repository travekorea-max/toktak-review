# 톡톡리뷰 배포 가이드

## Vercel을 통한 무료 배포

### 준비사항
1. Supabase 프로젝트 생성 완료
2. GitHub 계정 (선택사항이지만 권장)
3. Vercel 계정 (무료)

## 방법 1: Vercel CLI를 통한 배포 (추천)

### Step 1: Vercel CLI 설치
```bash
npm install -g vercel
```

### Step 2: Vercel 로그인
```bash
vercel login
```
- 이메일로 로그인 링크가 전송됩니다
- 링크를 클릭하여 인증 완료

### Step 3: 프로젝트 빌드 테스트
```bash
cd C:\Users\trave\toktak-review
npm run build
```
- 에러 없이 빌드가 완료되는지 확인

### Step 4: 첫 배포
```bash
vercel
```
- 프로젝트 설정 질문에 답변:
  - `Set up and deploy "toktak-review"?` → **Y**
  - `Which scope?` → 본인 계정 선택
  - `Link to existing project?` → **N**
  - `What's your project's name?` → **toktak-review** (또는 원하는 이름)
  - `In which directory is your code located?` → **./** (엔터)
  - `Want to modify these settings?` → **N**

### Step 5: 환경 변수 설정
```bash
# Supabase URL 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL

# 값 입력 프롬프트에서 실제 Supabase Project URL 입력
# 예: https://abcdefghijk.supabase.co

# Supabase Anon Key 추가
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 값 입력 프롬프트에서 실제 Supabase Anon Key 입력
```

환경 변수 적용을 위한 질문:
- `Add to which environment?` → **Production, Preview, Development** (스페이스바로 모두 선택 후 엔터)

### Step 6: 프로덕션 배포
```bash
vercel --prod
```

배포가 완료되면 다음과 같은 URL이 제공됩니다:
```
✅ Production: https://toktak-review.vercel.app
```

### Step 7: 배포 확인
1. 제공된 URL 접속
2. `/auth/login` 페이지가 정상적으로 로드되는지 확인
3. 회원가입 테스트

## 방법 2: GitHub + Vercel 자동 배포 (권장)

### Step 1: GitHub 저장소 생성
```bash
cd C:\Users\trave\toktak-review

# Git 초기화
git init

# .gitignore 확인 (이미 있음)
# .env.local, .next, node_modules 등이 포함되어 있어야 함

# 파일 추가
git add .
git commit -m "Initial commit: 톡톡리뷰 프로젝트"

# GitHub에 새 저장소 생성 (https://github.com/new)
# 저장소 이름: toktak-review
# Private으로 생성 권장

# 원격 저장소 연결
git remote add origin https://github.com/your-username/toktak-review.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel과 GitHub 연동
1. https://vercel.com 접속
2. "Add New..." → "Project" 클릭
3. "Import Git Repository" 섹션에서 GitHub 연동
4. `toktak-review` 저장소 선택
5. "Import" 클릭

### Step 3: 환경 변수 설정
1. "Environment Variables" 섹션에서 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```
2. "Deploy" 클릭

### Step 4: 자동 배포 확인
**이후 코드 수정 시:**
```bash
git add .
git commit -m "기능 추가: ..."
git push
```
- GitHub에 push하면 Vercel이 자동으로 배포
- 약 2-3분 후 변경사항이 반영됨

## 배포 후 설정

### 커스텀 도메인 설정 (선택사항)
1. Vercel 프로젝트 대시보드 → "Settings" → "Domains"
2. 본인 도메인 입력 (예: toktak-review.com)
3. DNS 설정 안내에 따라 도메인 연결
4. 자동 HTTPS 인증서 발급

### Supabase Redirect URLs 설정
1. Supabase 대시보드 → Authentication → URL Configuration
2. "Site URL" 업데이트:
   ```
   https://toktak-review.vercel.app
   ```
3. "Redirect URLs" 추가:
   ```
   https://toktak-review.vercel.app/**
   ```

## 배포 상태 확인

### 배포 로그 확인
```bash
vercel logs
```

### 프로젝트 목록 확인
```bash
vercel list
```

### 현재 배포된 URL 확인
```bash
vercel ls
```

## 업데이트 배포

### CLI 사용
```bash
# 코드 수정 후
vercel --prod
```

### GitHub 사용 (연동된 경우)
```bash
git add .
git commit -m "업데이트 내용"
git push
# 자동으로 배포됨
```

## 문제 해결

### 빌드 에러
```bash
# 로컬에서 먼저 테스트
npm run build

# 에러가 있다면 수정 후 다시 배포
vercel --prod
```

### 환경 변수 에러
```bash
# 환경 변수 목록 확인
vercel env ls

# 환경 변수 삭제
vercel env rm VARIABLE_NAME production

# 다시 추가
vercel env add VARIABLE_NAME
```

### 배포 롤백
```bash
# 이전 버전으로 롤백
vercel rollback
```

## 비용

### Vercel 무료 플랜
- **무료 제공:**
  - 100GB 대역폭/월
  - 무제한 배포
  - 자동 HTTPS
  - 글로벌 CDN
  - 기본 분석

- **제한사항:**
  - 팀 멤버 1명만
  - 동시 빌드 1개
  - 빌드 타임 45분 제한

**충분히 사용 가능:** 초기 서비스는 무료 플랜으로 충분합니다!

### Supabase 무료 플랜
- **무료 제공:**
  - 500MB 데이터베이스
  - 1GB 파일 스토리지
  - 5만 월간 활성 사용자
  - 2GB 데이터 전송

**충분히 사용 가능:** 테스트 및 초기 운영에 충분합니다!

## 모니터링

### Vercel Analytics (선택사항)
```bash
npm install @vercel/analytics
```

`src/app/layout.tsx`에 추가:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Supabase Logs
- Supabase 대시보드에서 실시간 로그 확인
- 데이터베이스 쿼리 성능 모니터링
- Auth 이벤트 추적

## 배포 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] `supabase/schema.sql` 실행 완료
- [ ] `supabase/auth-sync.sql` 실행 완료
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] Vercel 계정 생성
- [ ] Vercel CLI 설치 또는 GitHub 연동
- [ ] 환경 변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] 첫 배포 완료
- [ ] Supabase Redirect URLs 설정
- [ ] 배포된 사이트에서 회원가입 테스트
- [ ] 배포된 사이트에서 로그인 테스트

## 다음 단계

배포가 완료되면:
1. 관리자 계정 생성 (SETUP_GUIDE.md 참조)
2. 테스트 캠페인 생성
3. 실제 사용자 초대
4. 피드백 수집 및 개선

## 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 프로덕션 체크리스트](https://supabase.com/docs/guides/platform/going-into-prod)
