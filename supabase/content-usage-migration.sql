-- 2차 활용 콘텐츠 사용 기록 테이블
-- 광고주가 리뷰 콘텐츠를 2차 활용할 때 기록

CREATE TABLE IF NOT EXISTS content_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES review_submissions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_type TEXT DEFAULT 'export', -- export, download, embed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, review_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_usage_campaign ON content_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_usage_review ON content_usage(review_id);
CREATE INDEX IF NOT EXISTS idx_content_usage_used_at ON content_usage(used_at);

-- RLS 정책
ALTER TABLE content_usage ENABLE ROW LEVEL SECURITY;

-- 광고주는 자신의 캠페인에 대한 콘텐츠 사용 기록만 조회/추가 가능
CREATE POLICY "Clients can view their own content usage"
  ON content_usage FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can insert their own content usage"
  ON content_usage FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE client_id = auth.uid()
    )
  );

-- 관리자는 모든 기록 조회 가능
CREATE POLICY "Admins can view all content usage"
  ON content_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 코멘트
COMMENT ON TABLE content_usage IS '2차 활용 콘텐츠 사용 기록';
COMMENT ON COLUMN content_usage.campaign_id IS '캠페인 ID';
COMMENT ON COLUMN content_usage.review_id IS '리뷰 ID';
COMMENT ON COLUMN content_usage.used_at IS '사용 일시';
COMMENT ON COLUMN content_usage.usage_type IS '사용 유형 (export, download, embed)';
COMMENT ON COLUMN content_usage.notes IS '메모';
