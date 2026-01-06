'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut,
  User,
  Settings,
  Menu,
  X,
  Bell,
  Gift,
  Wallet,
  Star,
  ChevronDown,
} from 'lucide-react'

interface NavbarProps {
  links: { href: string; label: string }[]
}

export function Navbar({ links }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, reviewerProfile, clientProfile, logout } = useAuthStore()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/auth/login')
  }

  const displayName = reviewerProfile?.name || clientProfile?.company_name || user?.email || ''
  const initials = displayName.substring(0, 2).toUpperCase()
  const points = reviewerProfile?.current_points || 0

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between h-14">
          {/* 로고 & 네비게이션 */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold text-gray-900">톡톡리뷰</span>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 우측 영역 */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* 리뷰어 포인트 */}
                {user.role === 'reviewer' && (
                  <Link
                    href="/reviewer/points"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] rounded-md hover:bg-[#E0E7FF] transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span className="text-sm font-medium text-[#4F46E5]">
                      {points.toLocaleString()}P
                    </span>
                  </Link>
                )}

                {/* 알림 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative w-8 h-8 p-0 hover:bg-gray-100"
                >
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
                </Button>

                {/* 사용자 메뉴 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1.5 px-2 h-8 hover:bg-gray-100"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-[#4F46E5] text-white text-[10px] font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="p-3">
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {user.role === 'reviewer' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/reviewer/dashboard" className="cursor-pointer">
                            <Gift className="w-4 h-4 mr-2 text-gray-500" />
                            내 체험단
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/reviewer/points" className="cursor-pointer">
                            <Wallet className="w-4 h-4 mr-2 text-gray-500" />
                            포인트
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/reviewer/profile" className="cursor-pointer">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                            내 정보
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'client' && (
                      <DropdownMenuItem asChild>
                        <Link href="/client/settings" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2 text-gray-500" />
                          설정
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/settings" className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2 text-gray-500" />
                          설정
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    로그인
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white">
                    시작하기
                  </Button>
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden w-8 h-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4F46E5] font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
