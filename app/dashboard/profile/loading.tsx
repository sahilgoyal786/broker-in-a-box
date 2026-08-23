export default function ProfileLoading() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 animate-pulse">
        <div className="h-7 w-32 bg-slate-700 rounded" />
        <div className="h-4 w-72 bg-slate-800 rounded mt-3" />
      </div>

      <div className="space-y-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="h-5 w-48 bg-slate-700 rounded mb-6" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-11 bg-slate-900 border border-slate-700 rounded-lg" />
              <div className="h-11 bg-slate-900 border border-slate-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
