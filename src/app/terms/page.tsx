'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 mb-8">시행일: 2024년 1월 1일</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제1조 (목적)</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            본 약관은 톡톡리뷰(이하 "회사")가 제공하는 리뷰 체험단 서비스(이하 "서비스")의 이용과 관련하여
            회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제2조 (정의)</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
          </p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>"서비스"란 회사가 제공하는 리뷰 체험단 중개 플랫폼을 의미합니다.</li>
            <li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 의미합니다.</li>
            <li>"리뷰어"란 체험단에 참여하여 제품을 체험하고 리뷰를 작성하는 회원을 의미합니다.</li>
            <li>"광고주"란 체험단 캠페인을 등록하고 리뷰어를 모집하는 회원을 의미합니다.</li>
            <li>"캠페인"이란 광고주가 등록한 체험단 모집 건을 의미합니다.</li>
            <li>"포인트"란 리뷰 작성 등 활동에 대한 보상으로 지급되는 서비스 내 재화를 의미합니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
            <li>약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 공지합니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제4조 (서비스의 제공)</h2>
          <p className="text-gray-700 leading-relaxed mb-4">회사는 다음과 같은 서비스를 제공합니다.</p>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>체험단 캠페인 등록 및 관리 서비스</li>
            <li>체험단 모집 및 매칭 서비스</li>
            <li>리뷰 작성 및 검수 서비스</li>
            <li>포인트 적립 및 출금 서비스</li>
            <li>기타 회사가 정하는 서비스</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제5조 (회원가입)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>회원가입은 이용자가 약관의 내용에 동의하고, 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 신청하는 것으로 이루어집니다.</li>
            <li>회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다.
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>실명이 아니거나 타인의 명의를 사용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>기타 회원으로 등록하는 것이 회사의 서비스 운영에 현저히 지장이 있다고 판단되는 경우</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제6조 (회원의 의무)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>회원은 본 약관 및 회사의 공지사항, 서비스 이용안내 등을 준수하여야 합니다.</li>
            <li>회원은 다음 행위를 하여서는 안 됩니다.
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>허위 정보의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사 및 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>허위 리뷰 작성 또는 리뷰 조작 행위</li>
                <li>부정한 방법으로 포인트를 획득하는 행위</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제7조 (리뷰어 이용규정)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>리뷰어는 캠페인에 신청 후 선정되면 성실하게 리뷰를 작성해야 합니다.</li>
            <li>리뷰는 캠페인에서 정한 기한 내에 작성해야 하며, 기한 내 미작성 시 불이익이 발생할 수 있습니다.</li>
            <li>리뷰 내용은 실제 체험을 바탕으로 솔직하게 작성해야 합니다.</li>
            <li>허위 리뷰, 복사 리뷰, 중복 리뷰 등 부정행위 적발 시 계정이 정지될 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제8조 (광고주 이용규정)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>광고주는 캠페인 등록 시 정확한 제품 정보를 기재해야 합니다.</li>
            <li>선정된 리뷰어에게 약속한 제품 및 리워드를 제공해야 합니다.</li>
            <li>리뷰어의 솔직한 리뷰 작성을 방해하거나 특정 내용을 강요해서는 안 됩니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제9조 (포인트 및 정산)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>포인트는 리뷰 승인 후 적립됩니다.</li>
            <li>포인트 출금은 최소 10,000P 이상부터 가능합니다.</li>
            <li>출금 신청 후 영업일 기준 3-5일 내에 처리됩니다.</li>
            <li>부정한 방법으로 획득한 포인트는 회수될 수 있습니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제10조 (서비스 이용의 제한 및 중지)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 중지할 수 있습니다.
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>서비스용 설비의 보수 등 공사로 인한 부득이한 경우</li>
                <li>전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우</li>
                <li>기타 불가항력적 사유가 있는 경우</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제11조 (면책조항)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>회사는 천재지변, 전쟁 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</li>
            <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
            <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않습니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">제12조 (분쟁해결)</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
            <li>회사와 회원 간에 발생한 분쟁에 관한 소송은 회사의 본사 소재지를 관할하는 법원을 전속관할로 합니다.</li>
            <li>회사와 회원 간에 제기된 소송에는 대한민국법을 적용합니다.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">부칙</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            본 약관은 2024년 1월 1일부터 시행합니다.
          </p>
        </div>
      </div>
    </div>
  )
}
