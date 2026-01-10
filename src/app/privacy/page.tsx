'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 mb-8">시행일: 2024년 1월 1일</p>

          <p className="text-gray-700 leading-relaxed mb-6">
            톡톡리뷰(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고
            개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. 개인정보의 처리 목적</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의
            용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>회원 가입 및 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정이용 방지, 가입의사 확인, 연령확인, 불만처리 등 민원처리, 고지사항 전달</li>
            <li><strong>서비스 제공:</strong> 체험단 매칭, 리뷰 관리, 포인트 적립 및 정산, 본인인증</li>
            <li><strong>마케팅 및 광고:</strong> 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. 개인정보의 처리 및 보유 기간</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은
            개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령에 따라 보존이 필요한 경우 해당 기간)</li>
            <li><strong>거래 기록:</strong> 전자상거래법에 따라 5년</li>
            <li><strong>접속 기록:</strong> 통신비밀보호법에 따라 3개월</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. 수집하는 개인정보 항목</h2>

          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">리뷰어 회원</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>필수항목:</strong> 이메일, 비밀번호, 이름, 휴대폰번호</li>
            <li><strong>선택항목:</strong> 주소, 네이버 ID, 쿠팡 ID, 인스타그램 URL, 블로그 URL</li>
            <li><strong>정산용:</strong> 은행명, 계좌번호, 예금주</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">광고주 회원</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>필수항목:</strong> 이메일, 비밀번호, 회사명, 사업자등록번호, 대표자명, 휴대폰번호, 쇼핑몰 URL</li>
            <li><strong>선택항목:</strong> 업종, 업태, 주소, 세금계산서 이메일</li>
            <li><strong>결제용:</strong> 은행명, 계좌번호, 예금주</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">자동 수집 정보</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>IP주소, 쿠키, 방문일시, 서비스 이용기록, 기기정보</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 원칙적으로 이용자의 개인정보를 제1조에서 명시한 목적 범위 내에서 처리하며,
            이용자의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.
            다만, 다음의 경우에는 개인정보를 제3자에게 제공할 수 있습니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. 개인정보처리 위탁</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">수탁업체</th>
                  <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">위탁업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">토스페이먼츠</td>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">결제 처리</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">AWS / Supabase</td>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">데이터 저장 및 호스팅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">SMS 발송 업체</td>
                  <td className="px-4 py-2 border-b text-sm text-gray-700">본인인증 문자 발송</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. 정보주체의 권리·의무</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>개인정보 열람요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제요구</li>
            <li>처리정지 요구</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. 개인정보의 파기</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체없이 해당 개인정보를 파기합니다.
            파기의 절차, 기한 및 방법은 다음과 같습니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
            <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. 개인정보 보호책임자</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의
            불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-700"><strong>개인정보 보호책임자</strong></p>
            <p className="text-gray-700">이메일: privacy@toktak-review.com</p>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. 개인정보 처리방침 변경</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및
            정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. 개인정보의 안전성 확보 조치</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li><strong>개인정보의 암호화:</strong> 이용자의 비밀번호는 암호화되어 저장 및 관리되고 있습니다.</li>
            <li><strong>해킹 등에 대비한 기술적 대책:</strong> 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하고 있습니다.</li>
            <li><strong>개인정보에 대한 접근 제한:</strong> 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
