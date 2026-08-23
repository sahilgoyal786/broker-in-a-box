import { TableSkeleton } from '../table-skeleton'

export default function TransactionsLoading() {
  return (
    <div className="p-8">
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-3" />
      </div>

      <div className="bg-white rounded-t-lg border border-b-0 border-gray-200 p-4 flex gap-3 animate-pulse">
        <div className="h-9 w-40 bg-gray-100 rounded" />
        <div className="h-9 w-40 bg-gray-100 rounded" />
        <div className="h-9 w-40 bg-gray-100 rounded" />
      </div>
      <TableSkeleton
        columns={['File ID', 'Agent', 'Role', 'Type', 'Client', 'Address', 'County', 'Sales Price', 'Settlement', 'Status']}
      />
    </div>
  )
}
