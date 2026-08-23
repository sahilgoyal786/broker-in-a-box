export default function DashboardLoading() {
  return (
    <div className="p-8 animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-56 bg-gray-100 rounded mt-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg p-6 border border-gray-200 bg-white shadow">
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
