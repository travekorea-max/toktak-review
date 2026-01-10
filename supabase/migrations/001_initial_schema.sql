-- =====================================================
-- 톡톡리뷰 데이터베이스 스키마
-- Supabase에서 실행하세요
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'client', 'reviewer');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'withdrawn');
CREATE TYPE platform AS ENUM ('naver', 'coupang', 'both');
CREATE TYPE shop_platform AS ENUM ('smartstore', 'coupang', 'own', 'etc');
CREATE TYPE client_grade AS ENUM ('new', 'regular', 'premium');
CREATE TYPE selection_type AS ENUM ('manual', 'auto_fcfs', 'auto_random');
CREATE TYPE campaign_status AS ENUM ('draft', 'pending', 'recruiting', 'closed', 'in_progress', 'reviewing', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('applied', 'selected', 'settled', 'rejected', 'cancelled');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE review_status AS ENUM ('pending', 'ai_passed', 'needs_review', 'approved', 'revision_requested', 'rejected');
CREATE TYPE point_transaction_type AS ENUM ('earn', 'withdraw', 'cancel');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'completed', 'rejected');
CREATE TYPE deposit_type AS ENUM ('deposit', 'refund', 'payment');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'virtual_account');

-- =====================================================
-- TABLES
-- =====================================================

-- Users 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 리뷰어 프로필
CREATE TABLE reviewer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  address_zipcode VARCHAR(10),
  address_main VARCHAR(255),
  address_detail VARCHAR(255),
  bank_name VARCHAR(50),
  bank_account VARCHAR(50),
  bank_holder VARCHAR(50),
  naver_id VARCHAR(100),
  coupang_id VARCHAR(100),
  instagram_url VARCHAR(255),
  blog_url VARCHAR(255),
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  point_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 업체(광고주) 프로필
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  business_number VARCHAR(20) NOT NULL,
  business_type VARCHAR(100),
  business_category VARCHAR(100),
  representative_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_zipcode VARCHAR(10),
  address_main VARCHAR(255),
  address_detail VARCHAR(255),
  shop_url VARCHAR(500) NOT NULL,
  shop_platform shop_platform NOT NULL,
  bank_name VARCHAR(50),
  bank_account VARCHAR(50),
  bank_holder VARCHAR(50),
  tax_email VARCHAR(255),
  grade client_grade NOT NULL DEFAULT 'new',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 캠페인
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  product_price INTEGER NOT NULL,
  product_images TEXT[],
  product_url_naver VARCHAR(500),
  product_url_coupang VARCHAR(500),
  platform platform NOT NULL,
  recruit_count_naver INTEGER NOT NULL DEFAULT 0,
  recruit_count_coupang INTEGER NOT NULL DEFAULT 0,
  review_fee_naver INTEGER NOT NULL DEFAULT 0,
  review_fee_coupang INTEGER NOT NULL DEFAULT 0,
  product_payback_naver INTEGER NOT NULL DEFAULT 0,
  product_payback_coupang INTEGER NOT NULL DEFAULT 0,
  additional_point_naver INTEGER NOT NULL DEFAULT 0,
  additional_point_coupang INTEGER NOT NULL DEFAULT 0,
  is_empty_box BOOLEAN NOT NULL DEFAULT FALSE,
  recruit_start_date TIMESTAMPTZ NOT NULL,
  recruit_end_date TIMESTAMPTZ NOT NULL,
  announce_date TIMESTAMPTZ NOT NULL,
  review_deadline TIMESTAMPTZ NOT NULL,
  selection_type selection_type NOT NULL DEFAULT 'manual',
  conditions JSONB,
  review_guide JSONB,
  min_text_length INTEGER NOT NULL DEFAULT 300,
  min_photo_count INTEGER NOT NULL DEFAULT 3,
  required_keywords TEXT[],
  status campaign_status NOT NULL DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 캠페인 이미지 (별도 테이블)
CREATE TABLE campaign_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 캠페인 신청
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform platform NOT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  selected_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, reviewer_id, platform)
);

-- 구매 인증
CREATE TABLE purchase_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  order_number VARCHAR(100) NOT NULL,
  purchase_date DATE,
  image_url VARCHAR(500),
  wishlist_image_url VARCHAR(500),
  cart_image_url VARCHAR(500),
  purchase_image_url VARCHAR(500),
  status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 리뷰 제출
CREATE TABLE review_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  review_url VARCHAR(500) NOT NULL,
  screenshot_url VARCHAR(500),
  text_content TEXT,
  text_length INTEGER,
  photo_count INTEGER,
  keywords_found TEXT[],
  status review_status NOT NULL DEFAULT 'pending',
  ai_score DECIMAL(3,2),
  ai_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 포인트 거래 내역
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type point_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 출금 신청
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  bank_name VARCHAR(50) NOT NULL,
  bank_account VARCHAR(50) NOT NULL,
  bank_holder VARCHAR(50) NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 업체 예치금
CREATE TABLE client_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type deposit_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 결제 내역
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  amount INTEGER NOT NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_key VARCHAR(255),
  order_id VARCHAR(255) NOT NULL UNIQUE,
  receipt_url VARCHAR(500),
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 알림 설정
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  campaign_new BOOLEAN NOT NULL DEFAULT TRUE,
  application_result BOOLEAN NOT NULL DEFAULT TRUE,
  deadline_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  point_earned BOOLEAN NOT NULL DEFAULT TRUE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 휴대폰 인증 코드
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_reviewer_profiles_user_id ON reviewer_profiles(user_id);
CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_platform ON campaigns(platform);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_reviewer_id ON applications(reviewer_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_purchase_verifications_application_id ON purchase_verifications(application_id);
CREATE INDEX idx_review_submissions_application_id ON review_submissions(application_id);
CREATE INDEX idx_point_transactions_reviewer_id ON point_transactions(reviewer_id);
CREATE INDEX idx_withdrawal_requests_reviewer_id ON withdrawal_requests(reviewer_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Reviewer profiles policies
CREATE POLICY "Anyone can view reviewer profiles" ON reviewer_profiles FOR SELECT USING (true);
CREATE POLICY "Reviewers can update own profile" ON reviewer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Reviewers can insert own profile" ON reviewer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Client profiles policies
CREATE POLICY "Anyone can view client profiles" ON client_profiles FOR SELECT USING (true);
CREATE POLICY "Clients can update own profile" ON client_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clients can insert own profile" ON client_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Campaigns policies
CREATE POLICY "Anyone can view recruiting campaigns" ON campaigns FOR SELECT USING (status = 'recruiting' OR client_id = auth.uid());
CREATE POLICY "Clients can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = client_id);

-- Applications policies
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (reviewer_id = auth.uid() OR campaign_id IN (SELECT id FROM campaigns WHERE client_id = auth.uid()));
CREATE POLICY "Reviewers can insert applications" ON applications FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Clients can update applications" ON applications FOR UPDATE USING (campaign_id IN (SELECT id FROM campaigns WHERE client_id = auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Point transactions policies
CREATE POLICY "Users can view own transactions" ON point_transactions FOR SELECT USING (auth.uid() = reviewer_id);

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can insert own withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'reviewer')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run in Supabase Dashboard > Storage

-- CREATE BUCKET campaign-images (public)
-- CREATE BUCKET verification-images (public)
-- CREATE BUCKET review-screenshots (public)
-- CREATE BUCKET profile-images (public)
