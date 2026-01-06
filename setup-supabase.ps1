# Supabase 테이블 자동 생성 스크립트

$SQL = @"
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.verification_codes;
CREATE POLICY "Anyone can insert verification codes" ON public.verification_codes
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read their verification codes" ON public.verification_codes;
CREATE POLICY "Anyone can read their verification codes" ON public.verification_codes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update their verification codes" ON public.verification_codes;
CREATE POLICY "Anyone can update their verification codes" ON public.verification_codes
    FOR UPDATE USING (true);
"@

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  Supabase 테이블 생성 스크립트" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# SQL을 클립보드에 복사
$SQL | Set-Clipboard
Write-Host "✓ SQL이 클립보드에 복사되었습니다!" -ForegroundColor Green
Write-Host ""

# Supabase SQL Editor 열기
Write-Host "Supabase SQL Editor를 엽니다..." -ForegroundColor Yellow
Start-Process "https://supabase.com/dashboard/project/uqtiozbsgvqnhepkflqr/sql/new"

Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. 브라우저에서 Supabase SQL Editor가 열립니다" -ForegroundColor Cyan
Write-Host "2. Ctrl+V를 눌러 SQL을 붙여넣습니다" -ForegroundColor Cyan
Write-Host "3. 'RUN' 버튼을 클릭합니다" -ForegroundColor Cyan
Write-Host "4. 'Success. No rows returned' 메시지가 나오면 완료!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
