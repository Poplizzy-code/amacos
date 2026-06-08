export default function Forum() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-[#1a3c5e]">Forum</h1>
        <p className="text-gray-500 text-sm mt-1">Discuss topics with other students</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-16 h-16 bg-[#1a3c5e]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💬</span>
        </div>
        <h2 className="text-lg font-semibold text-[#1a3c5e] mb-2">Coming Soon</h2>
        <p className="text-gray-400 text-sm">This feature is being built. Check back soon!</p>
      </div>
    </div>
  )
}