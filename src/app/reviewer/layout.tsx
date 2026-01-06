import { Navbar } from '@/components/layout/Navbar'

const reviewerLinks = [
  { href: '/reviewer/campaigns', label: '캠페인' },
  { href: '/reviewer/my-activities', label: '내 활동' },
  { href: '/reviewer/points', label: '포인트' },
  { href: '/reviewer/mypage', label: '마이페이지' },
]

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar links={reviewerLinks} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
