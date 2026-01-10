// 알림 시스템
import { createClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplates } from './email'

export type NotificationType =
  | 'campaign_new'
  | 'application_selected'
  | 'application_rejected'
  | 'review_approved'
  | 'review_rejected'
  | 'point_earned'
  | 'withdrawal_completed'
  | 'withdrawal_rejected'
  | 'deadline_reminder'
  | 'campaign_approved'
  | 'campaign_rejected'

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  emailData?: {
    template: keyof typeof emailTemplates
    params: any[]
  }
}

// 알림 생성 및 발송
export async function createNotification(data: NotificationData) {
  const supabase = await createClient()

  // DB에 알림 저장
  const { error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    })

  if (insertError) {
    console.error('Error creating notification:', insertError)
  }

  // 사용자의 알림 설정 확인
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', data.userId)
    .single()

  // 이메일 발송 (설정이 켜져있고, 이메일 데이터가 있는 경우)
  if (settings?.email_enabled && data.emailData) {
    // 사용자 이메일 조회
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', data.userId)
      .single()

    if (user?.email) {
      const template = emailTemplates[data.emailData.template]
      if (template) {
        const emailContent = template(...data.emailData.params)
        await sendEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        })
      }
    }
  }

  // TODO: SMS 발송 (settings.sms_enabled)
  // TODO: 푸시 알림 (settings.push_enabled)

  return { success: true }
}

// 리뷰어 선정 알림
export async function notifyApplicationSelected(
  userId: string,
  userName: string,
  campaignTitle: string,
  activityId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toktak-review.com'
  const activityUrl = `${appUrl}/reviewer/my-activities/${activityId}`

  await createNotification({
    userId,
    type: 'application_selected',
    title: '체험단 선정 안내',
    message: `"${campaignTitle}" 체험단에 선정되셨습니다! 축하드립니다.`,
    link: activityUrl,
    emailData: {
      template: 'applicationSelected',
      params: [userName, campaignTitle, activityUrl],
    },
  })
}

// 리뷰어 미선정 알림
export async function notifyApplicationRejected(
  userId: string,
  campaignTitle: string
) {
  await createNotification({
    userId,
    type: 'application_rejected',
    title: '체험단 선정 결과',
    message: `"${campaignTitle}" 체험단에 아쉽게도 선정되지 않았습니다. 다음 기회에 도전해 주세요!`,
    link: '/reviewer/campaigns',
  })
}

// 포인트 적립 알림
export async function notifyPointEarned(
  userId: string,
  userName: string,
  amount: number,
  campaignTitle: string,
  balance: number
) {
  await createNotification({
    userId,
    type: 'point_earned',
    title: '포인트 적립',
    message: `${amount.toLocaleString()}P가 적립되었습니다. (현재 잔액: ${balance.toLocaleString()}P)`,
    link: '/reviewer/points',
    emailData: {
      template: 'pointEarned',
      params: [userName, amount, campaignTitle, balance],
    },
  })
}

// 출금 완료 알림
export async function notifyWithdrawalCompleted(
  userId: string,
  userName: string,
  amount: number,
  bankName: string,
  bankAccount: string
) {
  const accountLast4 = bankAccount.slice(-4)

  await createNotification({
    userId,
    type: 'withdrawal_completed',
    title: '출금 완료',
    message: `${amount.toLocaleString()}원이 ${bankName} 계좌로 출금되었습니다.`,
    link: '/reviewer/points',
    emailData: {
      template: 'withdrawalCompleted',
      params: [userName, amount, bankName, accountLast4],
    },
  })
}

// 리뷰 마감 임박 알림
export async function notifyReviewDeadline(
  userId: string,
  userName: string,
  campaignTitle: string,
  daysLeft: number,
  activityId: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://toktak-review.com'
  const activityUrl = `${appUrl}/reviewer/my-activities/${activityId}`

  await createNotification({
    userId,
    type: 'deadline_reminder',
    title: '리뷰 마감 임박',
    message: `"${campaignTitle}" 리뷰 마감이 ${daysLeft}일 남았습니다.`,
    link: activityUrl,
    emailData: {
      template: 'reviewDeadlineReminder',
      params: [userName, campaignTitle, daysLeft, activityUrl],
    },
  })
}

// 캠페인 승인 알림 (광고주용)
export async function notifyCampaignApproved(
  userId: string,
  campaignTitle: string,
  campaignId: string
) {
  await createNotification({
    userId,
    type: 'campaign_approved',
    title: '캠페인 승인 완료',
    message: `"${campaignTitle}" 캠페인이 승인되어 모집이 시작됩니다.`,
    link: `/client/campaigns/${campaignId}`,
  })
}

// 캠페인 반려 알림 (광고주용)
export async function notifyCampaignRejected(
  userId: string,
  campaignTitle: string,
  reason: string
) {
  await createNotification({
    userId,
    type: 'campaign_rejected',
    title: '캠페인 반려',
    message: `"${campaignTitle}" 캠페인이 반려되었습니다. 사유: ${reason}`,
    link: '/client/campaigns',
  })
}
