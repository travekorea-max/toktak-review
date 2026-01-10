// 이메일 발송 라이브러리
// Resend 또는 Nodemailer를 사용할 수 있습니다

interface EmailOptions {
  to: string
  subject: string
  html: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// 개발 모드에서는 콘솔에 출력
const isDev = process.env.NODE_ENV === 'development'

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html } = options

  // 개발 모드에서는 콘솔에 출력
  if (isDev || !process.env.RESEND_API_KEY) {
    console.log('========== EMAIL (DEV MODE) ==========')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('HTML:', html.substring(0, 200) + '...')
    console.log('======================================')
    return { success: true, messageId: 'dev-' + Date.now() }
  }

  try {
    // Resend API 사용
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'noreply@toktak-review.com',
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error)
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 이메일 템플릿들
export const emailTemplates = {
  // 회원가입 환영 이메일
  welcome: (name: string) => ({
    subject: '[톡톡리뷰] 회원가입을 환영합니다!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>안녕하세요, ${name}님!</h2>
            <p>톡톡리뷰에 가입해 주셔서 감사합니다.</p>
            <p>지금 바로 다양한 체험단에 참여하고 리뷰를 작성해 보세요.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://toktak-review.com'}/reviewer/campaigns" class="button">
              캠페인 둘러보기
            </a>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 비밀번호 재설정
  passwordReset: (resetUrl: string) => ({
    subject: '[톡톡리뷰] 비밀번호 재설정',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>비밀번호 재설정</h2>
            <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해 주세요.</p>
            <a href="${resetUrl}" class="button">
              비밀번호 재설정
            </a>
            <p class="warning">
              본인이 요청하지 않은 경우, 이 이메일을 무시해 주세요.<br>
              링크는 24시간 동안만 유효합니다.
            </p>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 캠페인 선정 알림
  applicationSelected: (name: string, campaignTitle: string, activityUrl: string) => ({
    subject: `[톡톡리뷰] 축하합니다! "${campaignTitle}" 체험단에 선정되셨습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .highlight { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>${name}님, 축하합니다! 🎉</h2>
            <div class="highlight">
              <strong>"${campaignTitle}"</strong> 체험단에 선정되셨습니다!
            </div>
            <p>이제 제품을 구매하시고, 구매 인증 후 리뷰를 작성해 주세요.</p>
            <a href="${activityUrl}" class="button">
              활동 상세 보기
            </a>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 리뷰 마감 임박 알림
  reviewDeadlineReminder: (name: string, campaignTitle: string, daysLeft: number, activityUrl: string) => ({
    subject: `[톡톡리뷰] 리뷰 마감 ${daysLeft}일 전입니다 - "${campaignTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .warning { background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 16px; margin: 20px 0; color: #dc2626; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>${name}님, 리뷰 작성 마감이 다가왔어요!</h2>
            <div class="warning">
              <strong>"${campaignTitle}"</strong> 리뷰 마감까지 <strong>${daysLeft}일</strong> 남았습니다.
            </div>
            <p>기한 내에 리뷰를 작성하지 않으면 포인트가 지급되지 않을 수 있어요.</p>
            <a href="${activityUrl}" class="button">
              리뷰 작성하기
            </a>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 포인트 적립 알림
  pointEarned: (name: string, amount: number, campaignTitle: string, balance: number) => ({
    subject: `[톡톡리뷰] ${amount.toLocaleString()}P가 적립되었습니다!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .point-box { background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; padding: 24px; margin: 20px 0; color: white; text-align: center; }
          .point-amount { font-size: 36px; font-weight: bold; }
          .balance { font-size: 14px; opacity: 0.9; margin-top: 8px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>${name}님, 포인트가 적립되었어요! 🎁</h2>
            <div class="point-box">
              <div class="point-amount">+${amount.toLocaleString()}P</div>
              <div class="balance">현재 잔액: ${balance.toLocaleString()}P</div>
            </div>
            <p>"${campaignTitle}" 리뷰 승인으로 포인트가 적립되었습니다.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://toktak-review.com'}/reviewer/points" class="button">
              포인트 내역 보기
            </a>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 출금 완료 알림
  withdrawalCompleted: (name: string, amount: number, bankName: string, accountLast4: string) => ({
    subject: `[톡톡리뷰] ${amount.toLocaleString()}원 출금이 완료되었습니다`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Pretendard', -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .content { background: #f8f9fa; border-radius: 12px; padding: 32px; }
          .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .info-row:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">톡톡리뷰</div>
          </div>
          <div class="content">
            <h2>${name}님, 출금이 완료되었습니다! 💰</h2>
            <div class="info-box">
              <div class="info-row">
                <span>출금 금액</span>
                <strong>${amount.toLocaleString()}원</strong>
              </div>
              <div class="info-row">
                <span>입금 계좌</span>
                <strong>${bankName} ****${accountLast4}</strong>
              </div>
            </div>
            <p>영업일 기준 1-2일 내에 입금될 예정입니다.</p>
          </div>
          <div class="footer">
            <p>본 메일은 발신 전용입니다.</p>
            <p>&copy; 2024 톡톡리뷰. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
}
