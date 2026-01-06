'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, DollarSign, Bell, Shield, Save } from 'lucide-react'

interface SiteSettings {
  withdrawal_fee: number
  min_withdrawal_amount: number
  withdrawal_schedule: string
  default_review_fee_naver: number
  default_review_fee_coupang: number
  min_text_length: number
  min_photo_count: number
  auto_approve_campaigns: boolean
  email_notifications: boolean
  sms_notifications: boolean
}

const defaultSettings: SiteSettings = {
  withdrawal_fee: 500,
  min_withdrawal_amount: 5000,
  withdrawal_schedule: 'weekly',
  default_review_fee_naver: 5000,
  default_review_fee_coupang: 5000,
  min_text_length: 300,
  min_photo_count: 3,
  auto_approve_campaigns: false,
  email_notifications: true,
  sms_notifications: false,
}

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error

      if (data && data.length > 0) {
        const settingsObj: any = {}
        data.forEach((row: any) => {
          settingsObj[row.key] = row.value
        })
        setSettings({ ...defaultSettings, ...settingsObj })
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setMessage(null)

      // 각 설정을 개별적으로 upsert
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString(),
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: '설정이 저장되었습니다' })
    } catch (err) {
      console.error('Error saving settings:', err)
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">사이트 설정</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            톡톡리뷰 시스템 설정을 관리하세요
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출금 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              출금 설정
            </CardTitle>
            <CardDescription>
              리뷰어 포인트 출금 관련 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdrawal_fee">출금 수수료 (원)</Label>
              <Input
                id="withdrawal_fee"
                type="number"
                value={settings.withdrawal_fee}
                onChange={(e) => updateSetting('withdrawal_fee', parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500 mt-1">
                출금 시 차감되는 수수료
              </p>
            </div>

            <div>
              <Label htmlFor="min_withdrawal_amount">최소 출금 금액 (원)</Label>
              <Input
                id="min_withdrawal_amount"
                type="number"
                value={settings.min_withdrawal_amount}
                onChange={(e) => updateSetting('min_withdrawal_amount', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="withdrawal_schedule">출금 정산 주기</Label>
              <select
                id="withdrawal_schedule"
                className="w-full mt-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2"
                value={settings.withdrawal_schedule}
                onChange={(e) => updateSetting('withdrawal_schedule', e.target.value)}
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 리뷰 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              리뷰 기본 설정
            </CardTitle>
            <CardDescription>
              캠페인 생성 시 기본값
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default_review_fee_naver">네이버 기본 리뷰비 (원)</Label>
              <Input
                id="default_review_fee_naver"
                type="number"
                value={settings.default_review_fee_naver}
                onChange={(e) => updateSetting('default_review_fee_naver', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="default_review_fee_coupang">쿠팡 기본 리뷰비 (원)</Label>
              <Input
                id="default_review_fee_coupang"
                type="number"
                value={settings.default_review_fee_coupang}
                onChange={(e) => updateSetting('default_review_fee_coupang', parseInt(e.target.value) || 0)}
              />
            </div>

            <Separator />

            <div>
              <Label htmlFor="min_text_length">최소 리뷰 텍스트 길이 (자)</Label>
              <Input
                id="min_text_length"
                type="number"
                value={settings.min_text_length}
                onChange={(e) => updateSetting('min_text_length', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="min_photo_count">최소 사진 개수 (장)</Label>
              <Input
                id="min_photo_count"
                type="number"
                value={settings.min_photo_count}
                onChange={(e) => updateSetting('min_photo_count', parseInt(e.target.value) || 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 캠페인 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              캠페인 승인
            </CardTitle>
            <CardDescription>
              캠페인 자동 승인 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>캠페인 자동 승인</Label>
                <p className="text-sm text-gray-500">
                  업체가 등록한 캠페인을 자동으로 승인합니다
                </p>
              </div>
              <Switch
                checked={settings.auto_approve_campaigns}
                onCheckedChange={(checked) => updateSetting('auto_approve_campaigns', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              알림 설정
            </CardTitle>
            <CardDescription>
              시스템 알림 설정
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>이메일 알림</Label>
                <p className="text-sm text-gray-500">
                  중요 이벤트 발생 시 이메일 발송
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>SMS 알림</Label>
                <p className="text-sm text-gray-500">
                  중요 이벤트 발생 시 SMS 발송
                </p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
