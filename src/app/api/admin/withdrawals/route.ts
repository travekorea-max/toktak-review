import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyWithdrawalCompleted } from '@/lib/notifications'

// 출금 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        reviewer_profiles:reviewer_id (
          name,
          user_id
        )
      `)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ withdrawals: data })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}

// 출금 처리 (승인/거절)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { withdrawalId, action, rejectReason } = body

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 출금 신청 조회
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        reviewer_profiles:reviewer_id (
          name,
          user_id,
          point_balance
        )
      `)
      .eq('id', withdrawalId)
      .single()

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal already processed' },
        { status: 400 }
      )
    }

    const reviewerProfile = withdrawal.reviewer_profiles as any

    if (action === 'approve') {
      // 승인 처리
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', withdrawalId)

      if (updateError) throw updateError

      // 포인트 차감 기록
      const newBalance = reviewerProfile.point_balance - withdrawal.amount

      await supabase
        .from('point_transactions')
        .insert({
          reviewer_id: withdrawal.reviewer_id,
          type: 'withdraw',
          amount: -withdrawal.amount,
          balance_after: newBalance,
          reference_type: 'withdrawal',
          reference_id: withdrawalId,
          description: '포인트 출금',
        })

      // 포인트 잔액 업데이트
      await supabase
        .from('reviewer_profiles')
        .update({ point_balance: newBalance })
        .eq('user_id', withdrawal.reviewer_id)

      // 알림 발송
      await notifyWithdrawalCompleted(
        withdrawal.reviewer_id,
        reviewerProfile.name,
        withdrawal.amount,
        withdrawal.bank_name,
        withdrawal.bank_account
      )

      return NextResponse.json({
        success: true,
        message: '출금이 승인되었습니다',
      })
    } else if (action === 'reject') {
      if (!rejectReason) {
        return NextResponse.json(
          { error: 'Reject reason is required' },
          { status: 400 }
        )
      }

      // 거절 처리
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          reject_reason: rejectReason,
        })
        .eq('id', withdrawalId)

      if (updateError) throw updateError

      // 알림 발송 (거절)
      await supabase.from('notifications').insert({
        user_id: withdrawal.reviewer_id,
        type: 'withdrawal_rejected',
        title: '출금 신청 반려',
        message: `출금 신청이 반려되었습니다. 사유: ${rejectReason}`,
        link: '/reviewer/points',
      })

      return NextResponse.json({
        success: true,
        message: '출금이 반려되었습니다',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}
