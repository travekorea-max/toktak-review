'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Clock, Wallet, User } from 'lucide-react'

interface NavItem {
  href: string
  icon: any
  label: string
}

const reviewerNavItems: NavItem[] = [
  { href: '/reviewer/campaigns', icon: Home, label: '홈' },
  { href: '/reviewer/campaigns?search=true', icon: Search, label: '검색' },
  { href: '/reviewer/my-activities', icon: Clock, label: '활동' },
  { href: '/reviewer/points', icon: Wallet, label: '포인트' },
  { href: '/reviewer/mypage', icon: User, label: '마이' },
]

const clientNavItems: NavItem[] = [
  { href: '/client/dashboard', icon: Home, label: '홈' },
  { href: '/client/campaigns', icon: Search, label: '캠페인' },
  { href: '/client/campaigns/new', icon: Clock, label: '등록' },
  { href: '/client/mypage', icon: User, label: '마이' },
]

interface MobileNavProps {
  userType: 'reviewer' | 'client'
}

export function MobileNav({ userType }: MobileNavProps) {
  const pathname = usePathname()
  const navItems = userType === 'reviewer' ? reviewerNavItems : clientNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href.split('?')[0])

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive ? 'text-[#4F46E5]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
