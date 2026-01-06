'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, reviewerProfile, setReviewerProfile } = useAuthStore()

  const [name, setName] = useState(reviewerProfile?.name || '')
  const [phone, setPhone] = useState(reviewerProfile?.phone || '')
  const [addressZipcode, setAddressZipcode] = useState(reviewerProfile?.address_zipcode || '')
  const [addressMain, setAddressMain] = useState(reviewerProfile?.address_main || '')
  const [addressDetail, setAddressDetail] = useState(reviewerProfile?.address_detail || '')
  const [bankName, setBankName] = useState(reviewerProfile?.bank_name || '')
  const [bankAccount, setBankAccount] = useState(reviewerProfile?.bank_account || '')
  const [bankHolder, setBankHolder] = useState(reviewerProfile?.bank_holder || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('reviewer_profiles')
        .update({
          name,
          phone,
          address_zipcode: addressZipcode || null,
          address_main: addressMain || null,
          address_detail: addressDetail || null,
          bank_name: bankName || null,
          bank_account: bankAccount || null,
          bank_holder: bankHolder || null,
        })
        .eq('user_id', user?.id)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) setReviewerProfile(data)
      alert('프로필이 저장되었습니다')
    } catch (err) {
      console.error('Error:', err)
      setError('프로필 저장 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">프로필 관리</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          기본 정보와 계좌 정보를 수정하세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>배송지 정보</CardTitle>
            <CardDescription>제품 수령을 위한 주소를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="zipcode">우편번호</Label>
              <Input
                id="zipcode"
                value={addressZipcode}
                onChange={(e) => setAddressZipcode(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="addressMain">주소</Label>
              <Input
                id="addressMain"
                value={addressMain}
                onChange={(e) => setAddressMain(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="addressDetail">상세주소</Label>
              <Input
                id="addressDetail"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>계좌 정보</CardTitle>
            <CardDescription>포인트 출금을 위한 계좌 정보를 입력하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bankName">은행명</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bankAccount">계좌번호</Label>
              <Input
                id="bankAccount"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bankHolder">예금주</Label>
              <Input
                id="bankHolder"
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}
