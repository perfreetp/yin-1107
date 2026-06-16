import type { ReviewStatus } from '@/types'
import { STATUS_LABELS } from '@/types'

interface StatusBadgeProps {
  status: ReviewStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  
  const statusStyles: Record<ReviewStatus, string> = {
    pending: 'bg-gray-100 text-gray-700 border-gray-200',
    reviewing: 'bg-blue-100 text-blue-700 border-blue-200',
    resolved: 'bg-green-100 text-green-700 border-green-200',
    ignored: 'bg-slate-100 text-slate-600 border-slate-200'
  }
  
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${statusStyles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
