import type { IssueSeverity } from '@/types'
import { ISSUE_SEVERITY_LABELS } from '@/types'

interface SeverityBadgeProps {
  severity: IssueSeverity
  size?: 'sm' | 'md'
}

export function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  
  const severityStyles: Record<IssueSeverity, string> = {
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200'
  }
  
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${severityStyles[severity]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        severity === 'error' ? 'bg-red-500' :
        severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
      }`} />
      {ISSUE_SEVERITY_LABELS[severity]}
    </span>
  )
}
