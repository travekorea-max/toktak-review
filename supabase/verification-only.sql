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
CREATE POLICY "Anyone can insert verification codes" ON public.verification_codes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read their verification codes" ON public.verification_codes;
CREATE POLICY "Anyone can read their verification codes" ON public.verification_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update their verification codes" ON public.verification_codes;
CREATE POLICY "Anyone can update their verification codes" ON public.verification_codes FOR UPDATE USING (true);
