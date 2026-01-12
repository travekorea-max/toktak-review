'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckCircle,
  XCircle,
  Star,
  Coins,
  ArrowLeft,
  Users,
  Clock,
  UserCheck,
  UserX,
  Search
} from 'lucide-react'
import { Database } from '@/types/database'

type Campaign = Database['public']['Tables']['campaigns']['Row']
type Application = Database['public']['Tables']['applications']['Row'] & {
  reviewer_profiles?: {
    name: string
    phone: string
    rating: number
    review_count: number
    naver_id: string | null
    coupang_id: string | null
  }
}

export default function ApplicantsManagementPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const campaignId = params.id as string

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchApplications()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      setCampaign(data)
    } catch (err) {
      console.error('Error fetching campaign:', err)
    }
  }

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('applications')
        .select(`
          *,
          reviewer_profiles:reviewer_id (
            name,
            phone,
            rating,
            review_count,
            naver_id,
            coupang_id
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      setApplications(data || [])
    } catch (err) {
      console.error('Error fetching applications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filtered = getFilteredApplications()
      setSelectedIds(filtered.map(app => app.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    if (!confirm(`${selectedIds.length}명을 선정하시겠습니까?`)) {
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('applications')
        .update({
          status: 'selected',
          selected_at: new Date().toISOString(),
        })
        .in('id', selectedIds)

      if (error) throw error

      alert('선정이 완료되었습니다')
      setSelectedIds([])
      fetchApplications()
    } catch (err) {
      console.error('Error approving:', err)
      alert('선정 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    if (!confirm(`${selectedIds.length}명을 미선정 처리하시겠습니까?`)) {
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .in('id', selectedIds)

      if (error) throw error

      alert('미선정 처리가 완료되었습니다')
      setSelectedIds([])
      fetchApplications()
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('미선정 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleIndividualApprove = async (id: string) => {
    if (!confirm('이 지원자를 선정하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'selected',
          selected_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      alert('선정이 완료되었습니다')
      fetchApplications()
    } catch (err) {
      console.error('Error approving:', err)
      alert('선정 처리 중 오류가 발생했습니다')
    }
  }

  const handleIndividualReject = async (id: string) => {
    if (!confirm('이 지원자를 미선정 처리하시겠습니까?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error

      alert('미선정 처리가 완료되었습니다')
      fetchApplications()
    } catch (err) {
      console.error('Error rejecting:', err)
      alert('미선정 처리 중 오류가 발생했습니다')
    }
  }

  const handleIndividualSettle = async (id: string) => {
    if (!confirm('이 지원자의 정산을 완료 처리하시겠습니까?\n포인트가 지급됩니다.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'settled',
          settled_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      alert('정산 처리가 완료되었습니다')
      fetchApplications()
    } catch (err) {
      console.error('Error settling:', err)
      alert('정산 처리 중 오류가 발생했습니다')
    }
  }

  const handleBulkSettle = async () => {
    if (selectedIds.length === 0) {
      alert('선택된 지원자가 없습니다')
      return
    }

    if (!confirm(`${selectedIds.length}명의 정산을 완료 처리하시겠습니까?\n포인트가 지급됩니다.`)) {
      return
    }

    try {
      setIsProcessing(true)

      const { error } = await supabase
        .from('applications')
        .update({
          status: 'settled',
          settled_at: new Date().toISOString(),
        })
        .in('id', selectedIds)

      if (error) throw error

      alert('정산 처리가 완료되었습니다')
      setSelectedIds([])
      fetchApplications()
    } catch (err) {
      console.error('Error settling:', err)
      alert('정산 처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications
    return applications.filter(app => app.status === activeTab)
  }

  const filteredApplications = getFilteredApplications()

  const tabs = [
    { key: 'all', label: '전체', count: applications.length },
    { key: 'applied', label: '검토대기', count: applications.filter(a => a.status === 'applied').length },
    { key: 'selected', label: '선정', count: applications.filter(a => a.status === 'selected').length },
    { key: 'settled', label: '정산완료', count: applications.filter(a => a.status === 'settled').length },
    { key: 'rejected', label: '미선정', count: applications.filter(a => a.status === 'rejected').length },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'applied':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-medium rounded-full">검토대기</span>
      case 'selected':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">선정</span>
      case 'settled':
        return <span className="px-2 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-xs font-medium rounded-full">정산완료</span>
      case 'rejected':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">미선정</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/client/campaigns/${campaignId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">지원자 관리</h1>
              <p className="text-sm text-gray-500">{campaign?.title}</p>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-xs text-gray-500">전체 지원자</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {applications.filter(a => a.status === 'applied').length}
                </p>
                <p className="text-xs text-gray-500">검토 대기</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {applications.filter(a => a.status === 'selected').length}
                </p>
                <p className="text-xs text-gray-500">선정</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#4F46E5]">
                  {applications.filter(a => a.status === 'settled').length}
                </p>
                <p className="text-xs text-gray-500">정산완료</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {applications.filter(a => a.status === 'rejected').length}
                </p>
                <p className="text-xs text-gray-500">미선정</p>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 & 일괄 처리 버튼 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setSelectedIds([])
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{selectedIds.length}명 선택</span>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isProcessing}
                  className="h-8 bg-emerald-500 hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  선정
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-[#4F46E5] hover:bg-[#4338CA]"
                  onClick={handleBulkSettle}
                  disabled={isProcessing}
                >
                  <Coins className="w-4 h-4 mr-1" />
                  정산
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  미선정
                </Button>
              </div>
            )}
          </div>

          {/* 테이블 헤더 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500">
            <div className="col-span-1 flex items-center">
              <Checkbox
                checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </div>
            <div className="col-span-3">이름</div>
            <div className="col-span-2">플랫폼</div>
            <div className="col-span-1">평점</div>
            <div className="col-span-1">리뷰수</div>
            <div className="col-span-2">신청일</div>
            <div className="col-span-2 text-right">작업</div>
          </div>

          {/* 리스트 */}
          <div className="divide-y divide-gray-50">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">
                <div className="w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">로딩 중...</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">지원자가 없습니다</p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div key={app.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-50 transition-colors">
                  {/* 체크박스 */}
                  <div className="col-span-12 md:col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedIds.includes(app.id)}
                      onCheckedChange={(checked) => handleSelect(app.id, checked as boolean)}
                    />
                  </div>

                  {/* 이름 & 연락처 */}
                  <div className="col-span-6 md:col-span-3">
                    <p className="font-medium text-gray-900">{app.reviewer_profiles?.name || '알 수 없음'}</p>
                    <p className="text-xs text-gray-500">{app.reviewer_profiles?.phone}</p>
                  </div>

                  {/* 플랫폼 */}
                  <div className="col-span-6 md:col-span-2">
                    {app.platform === 'naver' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#03C75A]/10 text-[#03C75A] text-xs font-medium rounded">
                        <span className="w-4 h-4 bg-[#03C75A] text-white text-[10px] font-bold rounded flex items-center justify-center">N</span>
                        네이버
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E53935]/10 text-[#E53935] text-xs font-medium rounded">
                        <span className="w-4 h-4 bg-[#E53935] text-white text-[10px] font-bold rounded flex items-center justify-center">C</span>
                        쿠팡
                      </span>
                    )}
                  </div>

                  {/* 평점 */}
                  <div className="col-span-3 md:col-span-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{app.reviewer_profiles?.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>

                  {/* 리뷰수 */}
                  <div className="col-span-3 md:col-span-1">
                    <span className="text-sm text-gray-600">{app.reviewer_profiles?.review_count || 0}건</span>
                  </div>

                  {/* 신청일 */}
                  <div className="col-span-6 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {new Date(app.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="md:hidden">{getStatusBadge(app.status)}</span>
                    </div>
                  </div>

                  {/* 작업 버튼 */}
                  <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                    <span className="hidden md:inline-block">{getStatusBadge(app.status)}</span>
                    {app.status === 'applied' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleIndividualApprove(app.id)}
                        >
                          선정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-gray-500"
                          onClick={() => handleIndividualReject(app.id)}
                        >
                          거부
                        </Button>
                      </>
                    )}
                    {app.status === 'selected' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[#4F46E5] hover:bg-[#4338CA]"
                        onClick={() => handleIndividualSettle(app.id)}
                      >
                        <Coins className="w-3 h-3 mr-1" />
                        정산
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
