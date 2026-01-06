import { Navbar } from '@/components/layout/Navbar'

const clientLinks = [
  { href: '/client/dashboard', label: '대시보드' },
  { href: '/client/campaigns', label: '캠페인 관리' },
  { href: '/client/settlements', label: '정산' },
  { href: '/client/settings', label: '설정' },
]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar links={clientLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
