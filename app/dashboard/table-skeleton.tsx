export function TableSkeleton({ columns, rows = 8 }: { columns: string[]; rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {columns.map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded" style={{ width: `${50 + ((i + j) % 4) * 10}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
