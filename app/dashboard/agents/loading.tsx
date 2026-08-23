import { TableSkeleton } from '../table-skeleton'

export default function AgentsLoading() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 animate-pulse">
        <div>
          <div className="h-7 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded mt-3" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <TableSkeleton
        columns={['Name', 'Email', 'Status', 'Core', 'Elective', 'Mandatory Class', 'NAR', 'License Expires', 'Active Listings', 'U/C Sales', 'Closed']}
      />
    </div>
  )
}
