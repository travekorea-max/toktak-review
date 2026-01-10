'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  Gift,
  CheckCircle,
  Clock,
  Megaphone,
  Settings
} from 'lucide-react'

interface NotificationSetting {
  id: string
  label: string
  description: string
  icon: any
  enabled: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'campaign_new',
      label: '새 캠페인 알림',
      description: '새로운 캠페인이 등록되면 알림을 받습니다',
      icon: Gift,
      enabled: true,
    },
    {
      id: 'application_result',
      label: '신청 결과 알림',
      description: '캠페인 선정/미선정 결과를 알림으로 받습니다',
      icon: CheckCircle,
      enabled: true,
    },
    {
      id: 'deadline_reminder',
      label: '마감 임박 알림',
      description: '리뷰 작성 마감일이 가까워지면 알림을 받습니다',
      icon: Clock,
      enabled: true,
    },
    {
      id: 'point_earned',
      label: '포인트 적립 알림',
      description: '포인트가 적립되면 알림을 받습니다',
      icon: Bell,
      enabled: true,
    },
    {
      id: 'marketing',
      label: '마케팅 정보 수신',
      description: '프로모션 및 이벤트 정보를 받습니다',
      icon: Megaphone,
      enabled: false,
    },
  ])

  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    push: true,
  })

  const [saved, setSaved] = useState(false)

  const handleSettingChange = (id: string, enabled: boolean) => {
    setSettings(prev =>
      prev.map(s => s.id === id ? { ...s, enabled } : s)
    )
    setSaved(false)
  }

  const handleChannelChange = (channel: keyof typeof channels, enabled: boolean) => {
    setChannels(prev => ({ ...prev, [channel]: enabled }))
    setSaved(false)
  }

  const handleSave = () => {
    // 실제로는 API 호출을 해야 함
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* 뒤로가기 */}
        <Link href="/reviewer/mypage" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          마이페이지
        </Link>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">알림 설정</h1>
          <p className="text-sm text-gray-500 mt-1">
            알림 수신 방법과 항목을 설정하세요
          </p>
        </div>

        {/* 알림 수신 방법 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">알림 수신 방법</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">이메일</p>
                  <p className="text-xs text-gray-500">이메일로 알림을 받습니다</p>
                </div>
              </div>
              <Switch
                checked={channels.email}
                onCheckedChange={(checked) => handleChannelChange('email', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">문자(SMS)</p>
                  <p className="text-xs text-gray-500">문자로 알림을 받습니다</p>
                </div>
              </div>
              <Switch
                checked={channels.sms}
                onCheckedChange={(checked) => handleChannelChange('sms', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">푸시 알림</p>
                  <p className="text-xs text-gray-500">앱/브라우저 푸시 알림</p>
                </div>
              </div>
              <Switch
                checked={channels.push}
                onCheckedChange={(checked) => handleChannelChange('push', checked)}
              />
            </div>
          </div>
        </div>

        {/* 알림 항목 */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">알림 항목</h2>
          </div>

          <div className="space-y-1">
            {settings.map((setting, index) => {
              const Icon = setting.icon
              return (
                <div
                  key={setting.id}
                  className={`flex items-center justify-between py-4 ${
                    index < settings.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      setting.enabled ? 'bg-[#EEF2FF]' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${
                        setting.enabled ? 'text-[#4F46E5]' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{setting.label}</p>
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 저장 버튼 */}
        <Button
          onClick={handleSave}
          className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA]"
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              저장되었습니다
            </>
          ) : (
            '설정 저장'
          )}
        </Button>
      </div>
    </div>
  )
}
