-- ============================================
-- 톡톡리뷰 기본 스키마 (간소화 버전)
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
-- USERS 테이블
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
-- REVIEWER_PROFILES 테이블
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
-- CLIENT_PROFILES 테이블
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
-- CAMPAIGNS 테이블
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
-- CAMPAIGN_IMAGES 테이블
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
-- APPLICATIONS 테이블
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
-- PURCHASE_VERIFICATIONS 테이블
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
-- REVIEW_SUBMISSIONS 테이블
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
-- POINT_TRANSACTIONS 테이블
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
-- WITHDRAWAL_REQUESTS 테이블
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
-- CLIENT_DEPOSITS 테이블
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
-- NOTIFICATIONS 테이블
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
-- CATEGORIES 테이블
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SETTINGS 테이블
-- ============================================
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 초기 데이터
-- ============================================
INSERT INTO settings (key, value) VALUES
    ('site_name', '"톡톡리뷰"'),
    ('withdrawal_fee_rate', '0.033'),
    ('min_withdrawal_amount', '10000'),
    ('point_exchange_rate', '1');
