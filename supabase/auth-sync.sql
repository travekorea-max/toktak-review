-- ============================================
-- Supabase Auth 연동 스크립트
-- ============================================
-- 이 스크립트는 Supabase Auth의 auth.users와 public.users를 동기화합니다

-- ============================================
-- 1. Auth 사용자 생성 시 public.users에 자동 추가
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        'reviewer', -- 기본값, 회원가입 시 프론트엔드에서 변경 필요
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. Auth 사용자 삭제 시 public.users도 삭제
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- ============================================
-- 3. Storage 버킷 생성 (이미지 업로드용)
-- ============================================

-- 캠페인 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;

-- 구매 인증 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-verifications', 'purchase-verifications', false)
ON CONFLICT (id) DO NOTHING;

-- 리뷰 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. Storage 정책 설정
-- ============================================

-- Campaign Images - 누구나 읽기, 업체만 업로드
CREATE POLICY "Anyone can view campaign images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-images');

CREATE POLICY "Clients can upload campaign images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'campaign-images' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'client'
    )
);

CREATE POLICY "Clients can update their campaign images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'campaign-images' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'client'
    )
);

CREATE POLICY "Clients can delete their campaign images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'campaign-images' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'client'
    )
);

-- Purchase Verifications - 리뷰어만 업로드, 본인과 관련 업체만 조회
CREATE POLICY "Reviewers can upload purchase verifications"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'purchase-verifications' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'reviewer'
    )
);

CREATE POLICY "Users can view their related purchase verifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'purchase-verifications');

-- Review Images - 리뷰어만 업로드
CREATE POLICY "Reviewers can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'review-images' AND
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'reviewer'
    )
);

CREATE POLICY "Users can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

-- ============================================
-- 5. 관리자 정책 추가 (모든 테이블)
-- ============================================

-- 관리자는 모든 데이터 조회 가능
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all campaigns" ON campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update campaigns" ON campaigns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all verifications" ON purchase_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update verifications" ON purchase_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all reviews" ON review_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update reviews" ON review_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all transactions" ON point_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all withdrawals" ON withdrawal_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update withdrawals" ON withdrawal_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 완료
-- ============================================
