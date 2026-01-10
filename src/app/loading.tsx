export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">로딩 중...</p>
      </div>
    </div>
  )
}
