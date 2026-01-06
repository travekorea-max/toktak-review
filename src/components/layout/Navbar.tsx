'use client'

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
import { LogOut, User, Settings } from 'lucide-react'

interface NavbarProps {
  links: { href: string; label: string }[]
}

export function Navbar({ links }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, reviewerProfile, clientProfile, logout } = useAuthStore()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/auth/login')
  }

  const displayName = reviewerProfile?.name || clientProfile?.company_name || user?.email || ''
  const initials = displayName.substring(0, 2).toUpperCase()

  return (
    <nav className="bg-white dark:bg-gray-900 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">톡톡리뷰</span>
            </Link>

            <div className="hidden md:flex space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href || pathname?.startsWith(link.href + '/')
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'reviewer' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/mypage/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          내 정보
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/mypage/settings" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          설정
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'client' && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        설정
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        설정
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost">로그인</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>회원가입</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
