import { TableSkeleton } from '../table-skeleton'

export default function AgenciesLoading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="h-8 w-56 bg-gray-200 rounded" />
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-40 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="flex gap-3 mb-4 animate-pulse">
        <div className="h-16 w-48 bg-gray-200 rounded-lg" />
        <div className="h-16 w-48 bg-gray-100 rounded-lg" />
      </div>

      <TableSkeleton
        columns={['Address', 'County', 'Type', 'MLS #', 'Price', 'Status', 'Agent', 'Expires', 'Actions']}
      />
    </div>
  )
}
