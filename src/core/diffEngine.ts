import { diffWords, diffChars } from 'diff'
import type { 
  DiffSegment, 
  FieldDiff, 
  ItemRecord, 
  FieldType,
  MaterialItem,
  ProcessStep,
  SpecialProcedure,
  AcceptCondition
} from '@/types'

export function computeDiff(oldStr: string, newStr: string): DiffSegment[] {
  if (oldStr === newStr) {
    return oldStr ? [{ type: 'unchanged', value: oldStr }] : []
  }
  
  const differences = diffWords(oldStr, newStr)
  const segments: DiffSegment[] = []
  
  for (const part of differences) {
    if (part.added) {
      segments.push({ type: 'added', value: part.value })
    } else if (part.removed) {
      segments.push({ type: 'removed', value: part.value })
    } else {
      segments.push({ type: 'unchanged', value: part.value })
    }
  }
  
  return segments
}

export function computeCharDiff(oldStr: string, newStr: string): DiffSegment[] {
  if (oldStr === newStr) {
    return oldStr ? [{ type: 'unchanged', value: oldStr }] : []
  }
  
  const differences = diffChars(oldStr, newStr)
  const segments: DiffSegment[] = []
  
  for (const part of differences) {
    if (part.added) {
      segments.push({ type: 'added', value: part.value })
    } else if (part.removed) {
      segments.push({ type: 'removed', value: part.value })
    } else {
      segments.push({ type: 'unchanged', value: part.value })
    }
  }
  
  return segments
}

export function serializeMaterials(materials: MaterialItem[]): string {
  return materials
    .map(m => `${m.name}${m.required ? '(必填)' : '(选填)'}${m.notes ? `[${m.notes}]` : ''}`)
    .join('；')
}

export function serializeProcessSteps(steps: ProcessStep[]): string {
  return steps
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map(s => `${s.stepNumber}. ${s.stepName}：${s.description}(${s.duration}，${s.handler})`)
    .join(' → ')
}

export function serializeSpecialProcedures(procs: SpecialProcedure[]): string {
  return procs
    .map(p => `[${p.type}] ${p.condition}：${p.description}`)
    .join('；')
}

export function serializeAcceptConditions(conditions: AcceptCondition[]): string {
  return conditions
    .map(c => `${c.type === 'positive' ? '✓' : '✗'} ${c.content}`)
    .join('；')
}

export function getFieldValue(item: ItemRecord, field: FieldType): string {
  switch (field) {
    case 'itemName': return item.itemName
    case 'itemCode': return item.itemCode
    case 'department': return item.department
    case 'timeLimit': return item.timeLimit
    case 'feeStandard': return item.feeStandard
    case 'handlingLocation': return item.handlingLocation
    case 'onlineUrl': return item.onlineUrl
    case 'consultPhone': return item.consultPhone
    case 'acceptConditions': return serializeAcceptConditions(item.acceptConditions)
    case 'materials': return serializeMaterials(item.materials)
    case 'processSteps': return serializeProcessSteps(item.processSteps)
    case 'specialProcedures': return serializeSpecialProcedures(item.specialProcedures)
    default: return ''
  }
}

export function compareFields(
  oldItem: ItemRecord,
  newItem: ItemRecord,
  field: FieldType
): FieldDiff | null {
  const oldValue = getFieldValue(oldItem, field)
  const newValue = getFieldValue(newItem, field)
  
  if (oldValue === newValue) {
    return null
  }
  
  return {
    field,
    oldValue,
    newValue,
    diffSegments: computeDiff(oldValue, newValue)
  }
}

export function compareItems(
  oldItem: ItemRecord,
  newItem: ItemRecord,
  fields: FieldType[]
): FieldDiff[] {
  const diffs: FieldDiff[] = []
  
  for (const field of fields) {
    const diff = compareFields(oldItem, newItem, field)
    if (diff) {
      diffs.push(diff)
    }
  }
  
  return diffs
}

export function findMatchedItems(
  sourceItems: ItemRecord[],
  targetItems: ItemRecord[]
): Array<[ItemRecord, ItemRecord]> {
  const matches: Array<[ItemRecord, ItemRecord]> = []
  const usedTargetIds = new Set<string>()
  
  for (const source of sourceItems) {
    let match: ItemRecord | undefined
    
    match = targetItems.find(
      t => !usedTargetIds.has(t.id) && 
           t.itemCode === source.itemCode && 
           t.itemCode.trim() !== ''
    )
    
    if (!match) {
      match = targetItems.find(
        t => !usedTargetIds.has(t.id) && 
             t.itemName === source.itemName
      )
    }
    
    if (!match) {
      const normalizedSource = source.itemName
        .replace(/\s+/g, '')
        .replace(/[（(][^）)]*[）)]/g, '')
      
      match = targetItems.find(t => {
        if (usedTargetIds.has(t.id)) return false
        const normalizedTarget = t.itemName
          .replace(/\s+/g, '')
          .replace(/[（(][^）)]*[）)]/g, '')
        return normalizedSource === normalizedTarget
      })
    }
    
    if (match) {
      usedTargetIds.add(match.id)
      matches.push([source, match])
    }
  }
  
  return matches
}
