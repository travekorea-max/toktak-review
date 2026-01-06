import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY!
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

async function testTossAPI() {
  console.log('=== 토스페이먼츠 API 연동 테스트 ===\n')

  // 1. 키 확인
  console.log('1. API 키 확인')
  console.log(`   클라이언트 키: ${TOSS_CLIENT_KEY.substring(0, 20)}...`)
  console.log(`   시크릿 키: ${TOSS_SECRET_KEY.substring(0, 20)}...`)

  if (!TOSS_SECRET_KEY || !TOSS_CLIENT_KEY) {
    console.log('\n❌ API 키가 설정되지 않았습니다.')
    return
  }
  console.log('   ✅ 키 설정 완료\n')

  // 2. API 연결 테스트 (결제 조회 - 빈 결과 예상)
  console.log('2. API 연결 테스트')

  const authHeader = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')

  try {
    // 테스트용 빌링키 조회 (존재하지 않는 키로 테스트)
    const response = await fetch('https://api.tosspayments.com/v1/payments/test-payment-key', {
      headers: {
        'Authorization': `Basic ${authHeader}`,
      },
    })

    const data = await response.json()

    if (response.status === 404) {
      // 404는 정상 - API 연결은 성공, 결제가 없을 뿐
      console.log('   ✅ API 연결 성공 (인증 통과)')
      console.log(`   응답: ${data.code} - ${data.message}\n`)
    } else if (response.status === 401) {
      console.log('   ❌ 인증 실패 - API 키를 확인하세요')
      console.log(`   응답: ${data.message}\n`)
      return
    } else {
      console.log(`   응답 상태: ${response.status}`)
      console.log(`   응답: ${JSON.stringify(data)}\n`)
    }

  } catch (error: any) {
    console.log(`   ❌ 연결 실패: ${error.message}`)
    return
  }

  // 3. 가상계좌 발급 테스트 (실제 발급)
  console.log('3. 가상계좌 발급 테스트')

  const testOrderId = `test-order-${Date.now()}`

  try {
    const response = await fetch('https://api.tosspayments.com/v1/virtual-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 10000,
        orderId: testOrderId,
        orderName: '테스트 주문',
        customerName: '테스트고객',
        bank: '04', // 국민은행
        validHours: 1, // 1시간 (테스트용 짧게)
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('   ✅ 가상계좌 발급 성공!')
      console.log(`   주문번호: ${data.orderId}`)
      console.log(`   은행: ${data.virtualAccount?.bankCode}`)
      console.log(`   계좌번호: ${data.virtualAccount?.accountNumber}`)
      console.log(`   예금주: ${data.virtualAccount?.customerName}`)
      console.log(`   금액: ${data.totalAmount.toLocaleString()}원`)
      console.log(`   입금기한: ${data.virtualAccount?.dueDate}`)
      console.log(`   결제키: ${data.paymentKey}`)
    } else {
      console.log(`   ❌ 발급 실패: ${data.code}`)
      console.log(`   메시지: ${data.message}`)
    }

  } catch (error: any) {
    console.log(`   ❌ 요청 실패: ${error.message}`)
  }

  console.log('\n=== 테스트 완료 ===')
}

testTossAPI().catch(console.error)
