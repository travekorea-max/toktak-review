'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowLeft } from 'lucide-react'

const faqs = [
  {
    category: '서비스 이용',
    items: [
      {
        question: '톡톡리뷰는 어떤 서비스인가요?',
        answer: '톡톡리뷰는 리뷰어와 광고주를 연결하는 체험단 매칭 플랫폼입니다. 광고주는 제품/서비스 체험단을 모집하고, 리뷰어는 체험 후 솔직한 리뷰를 작성합니다.'
      },
      {
        question: '가입비나 이용료가 있나요?',
        answer: '리뷰어 가입은 무료입니다. 광고주는 캠페인 등록 시 서비스 이용료가 발생하며, 상세 요금은 캠페인 등록 페이지에서 확인하실 수 있습니다.'
      },
      {
        question: '어떤 플랫폼에 리뷰를 작성하나요?',
        answer: '네이버 블로그, 인스타그램, 유튜브 등 다양한 플랫폼에 리뷰를 작성할 수 있습니다. 각 캠페인마다 요구하는 플랫폼이 다르니 캠페인 상세 정보를 확인해주세요.'
      }
    ]
  },
  {
    category: '리뷰어',
    items: [
      {
        question: '리뷰어로 가입하려면 어떻게 해야 하나요?',
        answer: '회원가입 페이지에서 "리뷰어"를 선택하고 필요한 정보를 입력하시면 됩니다. 가입 후 프로필을 완성하면 체험단에 신청할 수 있습니다.'
      },
      {
        question: '체험단에 선정되면 어떻게 되나요?',
        answer: '선정되면 알림을 받게 되며, 제품 수령 또는 서비스 이용 후 정해진 기간 내에 리뷰를 작성하시면 됩니다. 리뷰 승인 후 포인트가 적립됩니다.'
      },
      {
        question: '포인트는 어떻게 출금하나요?',
        answer: '마이페이지 > 포인트 관리에서 출금 신청이 가능합니다. 최소 출금 금액은 10,000원이며, 계좌 정보 등록 후 신청하시면 영업일 기준 3-5일 내에 입금됩니다.'
      },
      {
        question: '리뷰 작성 기한을 놓치면 어떻게 되나요?',
        answer: '기한 내 리뷰를 작성하지 않으면 패널티가 부과될 수 있으며, 반복될 경우 서비스 이용이 제한될 수 있습니다. 부득이한 사정이 있는 경우 미리 문의해주세요.'
      }
    ]
  },
  {
    category: '광고주',
    items: [
      {
        question: '캠페인은 어떻게 등록하나요?',
        answer: '광고주로 가입 후 "캠페인 관리" 메뉴에서 새 캠페인을 등록할 수 있습니다. 제품 정보, 모집 인원, 혜택 등을 입력하고 결제를 완료하면 캠페인이 시작됩니다.'
      },
      {
        question: '리뷰어 선정은 어떻게 하나요?',
        answer: '캠페인에 신청한 리뷰어들의 프로필과 이전 리뷰 이력을 확인하고 직접 선정하실 수 있습니다. 선정 완료 후 리뷰어에게 자동으로 알림이 발송됩니다.'
      },
      {
        question: '결제는 어떤 방법으로 가능한가요?',
        answer: '신용카드, 계좌이체 등 다양한 결제 수단을 지원합니다. 토스페이먼츠를 통해 안전하게 결제가 처리됩니다.'
      }
    ]
  },
  {
    category: '기타',
    items: [
      {
        question: '문의사항이 있으면 어디로 연락하나요?',
        answer: 'support@toktak-review.com으로 이메일을 보내주시거나, 페이지 하단의 "문의하기"를 통해 연락주시면 빠르게 답변 드리겠습니다.'
      },
      {
        question: '개인정보는 안전하게 보호되나요?',
        answer: '네, 모든 개인정보는 암호화되어 저장되며, 개인정보처리방침에 따라 안전하게 관리됩니다. 자세한 내용은 개인정보처리방침을 확인해주세요.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          자주 묻는 질문
        </h1>
        <p className="text-gray-500 mb-8">
          궁금하신 내용을 찾아보세요
        </p>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {category.category}
              </h2>
              <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
                {category.items.map((item, itemIndex) => {
                  const id = `${categoryIndex}-${itemIndex}`
                  const isOpen = openItems.includes(id)

                  return (
                    <div key={itemIndex}>
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-[#EEF2FF] rounded-xl text-center">
          <p className="text-gray-700 mb-4">
            원하시는 답변을 찾지 못하셨나요?
          </p>
          <a
            href="mailto:support@toktak-review.com"
            className="inline-flex items-center gap-2 bg-[#4F46E5] text-white px-6 py-3 rounded-lg hover:bg-[#4338CA] transition-colors"
          >
            문의하기
          </a>
        </div>
      </div>
    </div>
  )
}
