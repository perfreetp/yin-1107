import type { DiffSegment } from '@/types'

interface DiffHighlightProps {
  segments: DiffSegment[]
  className?: string
  side?: 'left' | 'right' | 'combined'
}

export function DiffHighlight({ segments, className = '', side = 'combined' }: DiffHighlightProps) {
  const filterSegments = (segs: DiffSegment[]): DiffSegment[] => {
    if (side === 'left') {
      return segs.map(s => {
        if (s.type === 'added') return null
        return s
      }).filter(Boolean) as DiffSegment[]
    }
    if (side === 'right') {
      return segs.map(s => {
        if (s.type === 'removed') return null
        return s
      }).filter(Boolean) as DiffSegment[]
    }
    return segs
  }

  const displaySegments = filterSegments(segments)

  return (
    <span className={className}>
      {displaySegments.map((segment, index) => {
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
