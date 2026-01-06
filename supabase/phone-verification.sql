-- ============================================
-- 휴대폰 인증 테이블
-- ============================================

-- 인증번호 저장 테이블
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_verification_codes_phone ON public.verification_codes(phone);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- RLS 활성화
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 인증번호를 생성하고 확인할 수 있도록 허용
CREATE POLICY "Anyone can insert verification codes" ON public.verification_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read their verification codes" ON public.verification_codes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update their verification codes" ON public.verification_codes
    FOR UPDATE USING (true);

-- 만료된 인증번호 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.verification_codes
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
