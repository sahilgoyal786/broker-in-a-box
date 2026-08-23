import { TableSkeleton } from '../table-skeleton'

export default function ListingsLoading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded" />
      </div>

      <TableSkeleton columns={['Property', 'Price', 'MLS #', 'Agent', 'Status', 'Expires', 'Actions']} />
    </div>
  )
}
