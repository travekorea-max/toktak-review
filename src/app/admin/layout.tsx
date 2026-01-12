import { Navbar } from '@/components/layout/Navbar'

const adminLinks = [
  { href: '/admin/dashboard', label: '대시보드' },
  { href: '/admin/campaigns', label: '캠페인 관리' },
  { href: '/admin/payments', label: '결제 관리' },
  { href: '/admin/users', label: '회원 관리' },
  { href: '/admin/verifications', label: '인증 검토' },
  { href: '/admin/reviews', label: '리뷰 검수' },
  { href: '/admin/withdrawals', label: '출금 관리' },
  { href: '/admin/settlements', label: '정산 관리' },
  { href: '/admin/settings', label: '설정' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar links={adminLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
