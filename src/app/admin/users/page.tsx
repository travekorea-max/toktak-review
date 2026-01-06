'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row'] & {
  reviewer_profiles?: Database['public']['Tables']['reviewer_profiles']['Row']
  client_profiles?: Database['public']['Tables']['client_profiles']['Row']
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">회원 관리</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          전체 회원 정보를 조회하고 관리하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">전체</CardTitle>
            <p className="text-3xl font-bold">{users.length}명</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">리뷰어</CardTitle>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === 'reviewer').length}명
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">업체</CardTitle>
            <p className="text-3xl font-bold text-green-600">
              {users.filter(u => u.role === 'client').length}명
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-500">관리자</CardTitle>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}명
            </p>
          </CardHeader>
        </Card>
      </div>

      <div>
        <Input
          placeholder="이메일로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            전체 ({users.length})
          </TabsTrigger>
          <TabsTrigger value="reviewer">
            리뷰어 ({users.filter(u => u.role === 'reviewer').length})
          </TabsTrigger>
          <TabsTrigger value="client">
            업체 ({users.filter(u => u.role === 'client').length})
          </TabsTrigger>
          <TabsTrigger value="admin">
            관리자 ({users.filter(u => u.role === 'admin').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>이름/업체명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        로딩 중...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        회원이 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role === 'reviewer' && '리뷰어'}
                            {user.role === 'client' && '업체'}
                            {user.role === 'admin' && '관리자'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.reviewer_profiles?.[0]?.name || user.client_profiles?.[0]?.company_name || '-'}
                        </TableCell>
                        <TableCell>
                          {user.status === 'active' && (
                            <Badge className="bg-green-500">활성</Badge>
                          )}
                          {user.status === 'suspended' && (
                            <Badge variant="outline" className="text-red-600">정지</Badge>
                          )}
                          {user.status === 'withdrawn' && (
                            <Badge variant="outline">탈퇴</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
