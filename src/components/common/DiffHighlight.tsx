import type { DiffSegment } from '@/types'

interface DiffHighlightProps {
  segments: DiffSegment[]
  className?: string
}

export function DiffHighlight({ segments, className = '' }: DiffHighlightProps) {
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'added') {
          return (
            <span
              key={index}
              className="bg-green-100 text-green-800 border-b-2 border-green-500"
              title="新增内容"
            >
              {segment.value}
            </span>
          )
        }
        if (segment.type === 'removed') {
          return (
            <span
              key={index}
              className="bg-red-100 text-red-800 line-through border-b-2 border-red-500"
              title="删除内容"
            >
              {segment.value}
            </span>
          )
        }
        return <span key={index}>{segment.value}</span>
      })}
    </span>
  )
}
