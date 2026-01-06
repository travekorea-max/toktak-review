import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runMigration() {
  console.log('=== content_usage 테이블 생성 ===\n')

  // 테이블 존재 여부 확인
  const { data: tableCheck } = await supabase
    .from('content_usage')
    .select('id')
    .limit(1)

  if (tableCheck !== null) {
    console.log('✅ content_usage 테이블이 이미 존재합니다')
    return
  }

  console.log('테이블 생성 중...')
  console.log('⚠️  Supabase 대시보드에서 다음 SQL을 실행해주세요:\n')
  console.log(`
-- 2차 활용 콘텐츠 사용 기록 테이블
CREATE TABLE IF NOT EXISTS content_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES review_submissions(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  usage_type TEXT DEFAULT 'export',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_content_usage_campaign ON content_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_usage_review ON content_usage(review_id);
  `)

  console.log('\n또는 아래 API를 통해 테이블을 생성합니다...')

  // REST API로 테이블 생성 시도 (실패해도 계속 진행)
  try {
    // 테스트 데이터 삽입으로 테이블 존재 여부 확인
    const { error } = await supabase
      .from('content_usage')
      .insert({
        campaign_id: '00000000-0000-0000-0000-000000000000',
        review_id: '00000000-0000-0000-0000-000000000000',
      })

    if (error?.message.includes('does not exist')) {
      console.log('❌ 테이블이 없습니다. Supabase 대시보드에서 SQL을 실행해주세요.')
    } else {
      // 삽입 성공 또는 다른 에러 = 테이블 존재
      console.log('✅ content_usage 테이블 확인됨')

      // 테스트 데이터 삭제
      await supabase
        .from('content_usage')
        .delete()
        .eq('campaign_id', '00000000-0000-0000-0000-000000000000')
    }
  } catch (err) {
    console.log('에러:', err)
  }
}

runMigration().catch(console.error)
