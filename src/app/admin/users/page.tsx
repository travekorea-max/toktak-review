'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserCheck,
  Building2,
  Shield,
  Search,
  Mail,
  Calendar,
} from 'lucide-react'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row'] & {
  reviewer_profiles?: Database['public']['Tables']['reviewer_profiles']['Row']
  client_profiles?: Database['public']['Tables']['client_profiles']['Row']
}

const tabs = [
  { id: 'all', label: '전체' },
  { id: 'reviewer', label: '리뷰어' },
  { id: 'client', label: '업체' },
  { id: 'admin', label: '관리자' },
]

export default function UsersManagementPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data } = await supabase
        .from('users')
        .select(`
          *,
          reviewer_profiles (*),
          client_profiles (*)
        `)
        .order('created_at', { ascending: false })

      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredUsers = () => {
    let filtered = users

    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab)
    }

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredUsers = getFilteredUsers()

  const counts = {
    all: users.length,
    reviewer: users.filter(u => u.role === 'reviewer').length,
    client: users.filter(u => u.role === 'client').length,
    admin: users.filter(u => u.role === 'admin').length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">회원 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 회원 정보를 조회하고 관리하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <span className="text-sm text-gray-500">전체</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{counts.all}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-500">리뷰어</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{counts.reviewer}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm text-gray-500">업체</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{counts.client}명</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm text-gray-500">관리자</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{counts.admin}명</p>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="이메일로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeTab === tab.id ? 'text-white/80' : 'text-gray-400'}`}>
                {counts[tab.id as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-100">
            <div className="col-span-4">이메일</div>
            <div className="col-span-2">역할</div>
            <div className="col-span-3">이름/업체명</div>
            <div className="col-span-2">상태</div>
            <div className="col-span-1">가입일</div>
          </div>

          {/* 목록 */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">회원이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{user.email}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.role === 'reviewer' ? 'bg-blue-50 text-blue-600' :
                      user.role === 'client' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {user.role === 'reviewer' && '리뷰어'}
                      {user.role === 'client' && '업체'}
                      {user.role === 'admin' && '관리자'}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-gray-900">
                      {user.reviewer_profiles?.[0]?.name || user.client_profiles?.[0]?.company_name || '-'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {user.status === 'active' && (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                        활성
                      </span>
                    )}
                    {user.status === 'suspended' && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                        정지
                      </span>
                    )}
                    {user.status === 'withdrawn' && (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        탈퇴
                      </span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 총 인원 */}
        {filteredUsers.length > 0 && (
          <div className="text-center text-sm text-gray-500 mt-6">
            총 {filteredUsers.length}명의 회원
          </div>
        )}
      </div>
    </div>
  )
}
