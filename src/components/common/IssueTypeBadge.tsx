import type { IssueType } from '@/types'
import { ISSUE_TYPE_LABELS } from '@/types'

interface IssueTypeBadgeProps {
  type: IssueType
  size?: 'sm' | 'md'
}

export function IssueTypeBadge({ type, size = 'md' }: IssueTypeBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  
  const typeStyles: Record<IssueType, string> = {
    field_diff: 'bg-purple-100 text-purple-700 border-purple-200',
    condition_conflict: 'bg-red-100 text-red-700 border-red-200',
    material_inconsistent: 'bg-orange-100 text-orange-700 border-orange-200',
    step_duplicate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    special_missing: 'bg-pink-100 text-pink-700 border-pink-200',
    format_issue: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    expression_unstandard: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    cross_department_inconsistent: 'bg-rose-100 text-rose-700 border-rose-200'
  }
  
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${typeStyles[type]}`}>
      {ISSUE_TYPE_LABELS[type]}
    </span>
  )
}
