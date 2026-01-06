-- ============================================
-- 톡톡리뷰 데이터베이스 스키마
-- ============================================

-- ENUMS 생성
CREATE TYPE user_role AS ENUM ('admin', 'client', 'reviewer');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'withdrawn');
CREATE TYPE platform AS ENUM ('naver', 'coupang', 'both');
CREATE TYPE shop_platform AS ENUM ('smartstore', 'coupang', 'own', 'etc');
CREATE TYPE client_grade AS ENUM ('new', 'regular', 'premium');
CREATE TYPE selection_type AS ENUM ('manual', 'auto_fcfs', 'auto_random');
CREATE TYPE campaign_status AS ENUM ('draft', 'pending', 'recruiting', 'closed', 'in_progress', 'reviewing', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('applied', 'selected', 'rejected', 'cancelled');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE review_status AS ENUM ('pending', 'ai_passed', 'needs_review', 'approved', 'revision_requested', 'rejected');
CREATE TYPE point_transaction_type AS ENUM ('earn', 'withdraw', 'cancel');
CREATE TYPE reference_type AS ENUM ('review', 'withdrawal', 'adjustment');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'completed', 'rejected');
CREATE TYPE deposit_type AS ENUM ('deposit', 'refund', 'payment');

-- ============================================
-- 1. USERS 테이블
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'reviewer',
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 2. REVIEWER_PROFILES 테이블
-- ============================================
CREATE TABLE reviewer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    address_zipcode TEXT,
    address_main TEXT,
    address_detail TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    naver_id TEXT,
    coupang_id TEXT,
    instagram_url TEXT,
    blog_url TEXT,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    point_balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);

-- ============================================
-- 3. CLIENT_PROFILES 테이블
-- ============================================
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    business_number TEXT NOT NULL,
    business_type TEXT,
    business_category TEXT,
    representative_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_zipcode TEXT,
    address_main TEXT,
    address_detail TEXT,
    shop_url TEXT NOT NULL,
    shop_platform shop_platform NOT NULL,
    bank_name TEXT,
    bank_account TEXT,
    bank_holder TEXT,
    tax_email TEXT,
    grade client_grade NOT NULL DEFAULT 'new',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(business_number)
);

CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);

-- ============================================
-- 4. CAMPAIGNS 테이블
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_description TEXT,
    product_price INTEGER NOT NULL,
    product_url_naver TEXT,
    product_url_coupang TEXT,
    platform platform NOT NULL,
    recruit_count_naver INTEGER NOT NULL DEFAULT 0,
    recruit_count_coupang INTEGER NOT NULL DEFAULT 0,
    review_fee_naver INTEGER NOT NULL DEFAULT 0,
    review_fee_coupang INTEGER NOT NULL DEFAULT 0,
    recruit_start_date TIMESTAMPTZ NOT NULL,
    recruit_end_date TIMESTAMPTZ NOT NULL,
    announce_date TIMESTAMPTZ NOT NULL,
    review_deadline TIMESTAMPTZ NOT NULL,
    selection_type selection_type NOT NULL DEFAULT 'manual',
    conditions JSONB,
    review_guide JSONB,
    min_text_length INTEGER NOT NULL DEFAULT 100,
    min_photo_count INTEGER NOT NULL DEFAULT 1,
    required_keywords TEXT[],
    status campaign_status NOT NULL DEFAULT 'draft',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================
-- 5. CAMPAIGN_IMAGES 테이블
-- ============================================
CREATE TABLE campaign_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_images_campaign_id ON campaign_images(campaign_id);

-- ============================================
-- 6. APPLICATIONS 테이블
-- ============================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform platform NOT NULL,
    message TEXT,
    status application_status NOT NULL DEFAULT 'applied',
    selected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(campaign_id, reviewer_id, platform)
);

CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_reviewer_id ON applications(reviewer_id);
CREATE INDEX idx_applications_status ON applications(status);

-- ============================================
-- 7. PURCHASE_VERIFICATIONS 테이블
-- ============================================
CREATE TABLE purchase_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    image_url TEXT NOT NULL,
    platform platform NOT NULL,
    status verification_status NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id)
);

CREATE INDEX idx_purchase_verifications_application_id ON purchase_verifications(application_id);
CREATE INDEX idx_purchase_verifications_status ON purchase_verifications(status);

-- ============================================
-- 8. REVIEW_SUBMISSIONS 테이블
-- ============================================
CREATE TABLE review_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    review_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    platform platform NOT NULL,
    ai_check_result JSONB,
    manual_check_result JSONB,
    status review_status NOT NULL DEFAULT 'pending',
    revision_comment TEXT,
    checked_at TIMESTAMPTZ,
    checked_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(application_id)
);

CREATE INDEX idx_review_submissions_application_id ON review_submissions(application_id);
CREATE INDEX idx_review_submissions_status ON review_submissions(status);

-- ============================================
-- 9. POINT_TRANSACTIONS 테이블
-- ============================================
CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type point_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_type reference_type NOT NULL,
    reference_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_reviewer_id ON point_transactions(reviewer_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);

-- ============================================
-- 10. WITHDRAWAL_REQUESTS 테이블
-- ============================================
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    fee INTEGER NOT NULL,
    net_amount INTEGER NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    bank_holder TEXT NOT NULL,
    status withdrawal_status NOT NULL DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_requests_reviewer_id ON withdrawal_requests(reviewer_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- ============================================
-- 11. CLIENT_DEPOSITS 테이블
-- ============================================
CREATE TABLE client_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    type deposit_type NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_deposits_client_id ON client_deposits(client_id);
CREATE INDEX idx_client_deposits_campaign_id ON client_deposits(campaign_id);

-- ============================================
-- 12. NOTIFICATIONS 테이블
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 13. CATEGORIES 테이블
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. SETTINGS 테이블
-- ============================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

-- users 테이블 updated_at 트리거
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- campaigns 테이블 updated_at 트리거
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- settings 테이블 updated_at 트리거
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users 정책
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Reviewer Profiles 정책
CREATE POLICY "Reviewers can view their own profile" ON reviewer_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can update their own profile" ON reviewer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can insert their own profile" ON reviewer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Client Profiles 정책
CREATE POLICY "Clients can view their own profile" ON client_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own profile" ON client_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Clients can insert their own profile" ON client_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaigns 정책
CREATE POLICY "Anyone can view recruiting campaigns" ON campaigns
    FOR SELECT USING (status IN ('recruiting', 'closed', 'in_progress'));

CREATE POLICY "Clients can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() = client_id);

-- Applications 정책
CREATE POLICY "Reviewers can view their own applications" ON applications
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Clients can view applications for their campaigns" ON applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaigns
            WHERE campaigns.id = applications.campaign_id
            AND campaigns.client_id = auth.uid()
        )
    );

CREATE POLICY "Reviewers can insert applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update their own applications" ON applications
    FOR UPDATE USING (auth.uid() = reviewer_id);

-- Purchase Verifications 정책
CREATE POLICY "Reviewers can view their own verifications" ON purchase_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = purchase_verifications.application_id
            AND applications.reviewer_id = auth.uid()
        )
    );

CREATE POLICY "Reviewers can insert verifications" ON purchase_verifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = purchase_verifications.application_id
            AND applications.reviewer_id = auth.uid()
        )
    );

-- Review Submissions 정책
CREATE POLICY "Reviewers can view their own reviews" ON review_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = review_submissions.application_id
            AND applications.reviewer_id = auth.uid()
        )
    );

CREATE POLICY "Reviewers can insert reviews" ON review_submissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications
            WHERE applications.id = review_submissions.application_id
            AND applications.reviewer_id = auth.uid()
        )
    );

-- Point Transactions 정책
CREATE POLICY "Reviewers can view their own transactions" ON point_transactions
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can insert transactions" ON point_transactions
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Withdrawal Requests 정책
CREATE POLICY "Reviewers can view their own withdrawals" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can insert withdrawals" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Client Deposits 정책
CREATE POLICY "Clients can view their own deposits" ON client_deposits
    FOR SELECT USING (auth.uid() = client_id);

-- Notifications 정책
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 초기 데이터
-- ============================================

-- 기본 설정
INSERT INTO settings (key, value) VALUES
    ('site_name', '"톡톡리뷰"'),
    ('withdrawal_fee_rate', '0.033'),
    ('min_withdrawal_amount', '10000'),
    ('point_exchange_rate', '1');

-- ============================================
-- 완료
-- ============================================
