import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-bold text-[#4F46E5] mb-4">톡톡리뷰</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              리뷰어와 광고주를 연결하는<br />
              체험단 매칭 플랫폼
            </p>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">서비스</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/reviewer/campaigns" className="text-sm text-gray-500 hover:text-gray-900">
                  체험단 찾기
                </Link>
              </li>
              <li>
                <Link href="/auth/register/client" className="text-sm text-gray-500 hover:text-gray-900">
                  광고주 가입
                </Link>
              </li>
              <li>
                <Link href="/auth/register/reviewer" className="text-sm text-gray-500 hover:text-gray-900">
                  리뷰어 가입
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">고객지원</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-900">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <a href="mailto:support@toktak-review.com" className="text-sm text-gray-500 hover:text-gray-900">
                  문의하기
                </a>
              </li>
            </ul>
          </div>

          {/* 법적 고지 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">법적 고지</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; 2024 톡톡리뷰. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
