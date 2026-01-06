import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const testCampaigns = [
  {
    title: '[네이버] 프리미엄 무선 이어폰 체험단 모집',
    product_name: '에어팟 프로 2세대 호환 무선 이어폰',
    product_description: '고음질 블루투스 5.3 무선 이어폰입니다. 노이즈 캔슬링 기능과 30시간 배터리 지속시간을 자랑합니다.',
    product_price: 89000,
    platform: 'naver',
    recruit_count_naver: 20,
    recruit_count_coupang: 0,
    review_fee_naver: 8000,
    review_fee_coupang: 0,
    status: 'recruiting',
    min_text_length: 300,
    min_photo_count: 3,
    required_keywords: ['음질', '노이즈캔슬링', '배터리'],
  },
  {
    title: '[쿠팡] 유기농 그래놀라 시리얼 체험단',
    product_name: '내추럴 유기농 그래놀라 500g',
    product_description: '100% 유기농 재료로 만든 건강한 아침 식사. 견과류와 말린 과일이 풍부합니다.',
    product_price: 15900,
    platform: 'coupang',
    recruit_count_naver: 0,
    recruit_count_coupang: 30,
    review_fee_naver: 0,
    review_fee_coupang: 5000,
    status: 'recruiting',
    min_text_length: 200,
    min_photo_count: 2,
    required_keywords: ['맛있다', '건강'],
  },
  {
    title: '[네이버+쿠팡] 스마트 체중계 체험단 대모집',
    product_name: '블루투스 스마트 체중계 (체지방 측정)',
    product_description: '앱 연동으로 체중, 체지방, 근육량, BMI 등 12가지 건강 지표를 측정할 수 있는 스마트 체중계입니다.',
    product_price: 35000,
    platform: 'both',
    recruit_count_naver: 15,
    recruit_count_coupang: 15,
    review_fee_naver: 6000,
    review_fee_coupang: 6000,
    status: 'recruiting',
    min_text_length: 300,
    min_photo_count: 4,
    required_keywords: ['정확도', '앱연동', '디자인'],
  },
  {
    title: '[네이버] 프리미엄 마사지건 체험단',
    product_name: '딥티슈 마사지건 프로',
    product_description: '6단계 강도 조절, 4개의 마사지 헤드 포함. 근육 이완과 피로 회복에 탁월합니다.',
    product_price: 129000,
    platform: 'naver',
    recruit_count_naver: 10,
    recruit_count_coupang: 0,
    review_fee_naver: 12000,
    review_fee_coupang: 0,
    status: 'recruiting',
    min_text_length: 400,
    min_photo_count: 5,
    required_keywords: ['마사지', '근육', '피로회복'],
  },
  {
    title: '[쿠팡] 천연 수제 비누 세트 체험단',
    product_name: '라벤더 천연 수제 비누 3개입',
    product_description: '프랑스산 라벤더 에센셜 오일을 사용한 천연 수제 비누. 민감한 피부에도 안심하고 사용 가능합니다.',
    product_price: 19900,
    platform: 'coupang',
    recruit_count_naver: 0,
    recruit_count_coupang: 25,
    review_fee_naver: 0,
    review_fee_coupang: 4000,
    status: 'pending',
    min_text_length: 200,
    min_photo_count: 2,
    required_keywords: ['향기', '순하다'],
  },
  {
    title: '[네이버] 미니 공기청정기 체험단',
    product_name: '휴대용 미니 공기청정기',
    product_description: 'USB 충전식 미니 공기청정기. 책상, 차량 등 어디서나 깨끗한 공기를 마실 수 있습니다.',
    product_price: 45000,
    platform: 'naver',
    recruit_count_naver: 20,
    recruit_count_coupang: 0,
    review_fee_naver: 7000,
    review_fee_coupang: 0,
    status: 'completed',
    min_text_length: 300,
    min_photo_count: 3,
    required_keywords: ['공기질', '소음', '휴대성'],
  },
  {
    title: '[네이버+쿠팡] 무선 충전 패드 체험단',
    product_name: '15W 고속 무선 충전 패드',
    product_description: '아이폰, 갤럭시 모든 기종 호환. 15W 고속 무선 충전을 지원합니다.',
    product_price: 25000,
    platform: 'both',
    recruit_count_naver: 10,
    recruit_count_coupang: 10,
    review_fee_naver: 5000,
    review_fee_coupang: 5000,
    status: 'in_progress',
    min_text_length: 250,
    min_photo_count: 3,
    required_keywords: ['충전속도', '호환성'],
  },
  {
    title: '[쿠팡] 프리미엄 텀블러 체험단',
    product_name: '스테인리스 진공 텀블러 500ml',
    product_description: '12시간 보온, 24시간 보냉. 프리미엄 스테인리스 스틸 진공 단열 텀블러입니다.',
    product_price: 32000,
    platform: 'coupang',
    recruit_count_naver: 0,
    recruit_count_coupang: 20,
    review_fee_naver: 0,
    review_fee_coupang: 5500,
    status: 'recruiting',
    min_text_length: 250,
    min_photo_count: 3,
    required_keywords: ['보온', '보냉', '디자인'],
  },
]

async function createCampaigns() {
  console.log('========================================')
  console.log('   테스트 캠페인 데이터 생성')
  console.log('========================================\n')

  // 업체 계정 ID 가져오기
  const { data: clientUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'toktak.client@gmail.com')
    .single()

  if (!clientUser) {
    console.log('❌ 업체 계정을 찾을 수 없습니다.')
    return
  }

  console.log(`📦 업체 ID: ${clientUser.id}\n`)

  // 날짜 설정
  const now = new Date()
  const getDate = (daysFromNow: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() + daysFromNow)
    return date.toISOString()
  }

  let successCount = 0

  for (const campaign of testCampaigns) {
    console.log(`📝 생성 중: ${campaign.title}`)

    const { error } = await supabase.from('campaigns').insert({
      client_id: clientUser.id,
      title: campaign.title,
      product_name: campaign.product_name,
      product_description: campaign.product_description,
      product_price: campaign.product_price,
      platform: campaign.platform,
      recruit_count_naver: campaign.recruit_count_naver,
      recruit_count_coupang: campaign.recruit_count_coupang,
      review_fee_naver: campaign.review_fee_naver,
      review_fee_coupang: campaign.review_fee_coupang,
      recruit_start_date: getDate(-3),
      recruit_end_date: getDate(7),
      announce_date: getDate(8),
      review_deadline: getDate(21),
      selection_type: 'manual',
      min_text_length: campaign.min_text_length,
      min_photo_count: campaign.min_photo_count,
      required_keywords: campaign.required_keywords,
      status: campaign.status,
    })

    if (error) {
      console.log(`   ❌ 실패: ${error.message}`)
    } else {
      console.log(`   ✅ 성공`)
      successCount++
    }
  }

  console.log('\n========================================')
  console.log(`   생성 완료: ${successCount}/${testCampaigns.length}개`)
  console.log('========================================')

  // 생성된 캠페인 확인
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('title, platform, status, recruit_count_naver, recruit_count_coupang')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('\n📋 캠페인 목록:')
  console.table(campaigns)
}

createCampaigns().catch(console.error)
