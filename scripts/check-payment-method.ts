import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // 기존 결제 데이터 확인
  const { data, error } = await supabase
    .from('campaign_payments')
    .select('id, payment_method')
    .limit(5)

  if (error) {
    console.log('에러:', error.message)
  } else {
    console.log('기존 payment_method 값들:')
    data?.forEach(d => console.log(' -', d.payment_method))
  }
}

check().catch(console.error)
