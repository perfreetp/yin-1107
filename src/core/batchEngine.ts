import type {
  ItemRecord,
  BatchReplaceRule,
  FieldType
} from '@/types'
import { getFieldValue } from './diffEngine'

export function applyBatchReplace(
  item: ItemRecord,
  rule: BatchReplaceRule
): ItemRecord {
  if (!rule.enabled) return item
  
  const updatedItem = { ...item }
  const pattern = rule.isRegex ? new RegExp(rule.pattern, 'g') : rule.pattern
  
  for (const field of rule.targetFields) {
    const newValue = replaceFieldValue(updatedItem, field, pattern, rule.replacement)
    ;(updatedItem as any)[field] = newValue
  }
  
  return updatedItem
}

function replaceFieldValue(
  item: ItemRecord,
  field: FieldType,
  pattern: RegExp | string,
  replacement: string
): ItemRecord[FieldType] {
  const currentValue = getFieldValue(item, field)
  
  switch (field) {
    case 'itemName':
    case 'itemCode':
    case 'department':
    case 'timeLimit':
    case 'feeStandard':
    case 'handlingLocation':
    case 'onlineUrl':
    case 'consultPhone':
      return currentValue.replace(pattern, replacement)
    
    case 'acceptConditions':
      return item.acceptConditions.map(cond => ({
        ...cond,
        content: cond.content.replace(pattern, replacement)
      })) as ItemRecord['acceptConditions']
    
    case 'materials':
      return item.materials.map(mat => ({
        ...mat,
        name: mat.name.replace(pattern, replacement),
        notes: mat.notes ? mat.notes.replace(pattern, replacement) : mat.notes
      })) as ItemRecord['materials']
    
    case 'processSteps':
      return item.processSteps.map(step => ({
        ...step,
        stepName: step.stepName.replace(pattern, replacement),
        description: step.description.replace(pattern, replacement),
        handler: step.handler.replace(pattern, replacement)
      })) as ItemRecord['processSteps']
    
    case 'specialProcedures':
      return item.specialProcedures.map(proc => ({
        ...proc,
        type: proc.type.replace(pattern, replacement),
        condition: proc.condition.replace(pattern, replacement),
        description: proc.description.replace(pattern, replacement)
      })) as ItemRecord['specialProcedures']
    
    default:
      return item[field]
  }
}

export function applyBatchRules(
  items: ItemRecord[],
  rules: BatchReplaceRule[]
): { items: ItemRecord[]; changes: Array<{ itemId: string; itemName: string; field: FieldType; oldValue: string; newValue: string }> } {
  const changes: Array<{ itemId: string; itemName: string; field: FieldType; oldValue: string; newValue: string }> = []
  
  const updatedItems = items.map(item => {
    let updatedItem = item
    
    for (const rule of rules) {
      if (!rule.enabled) continue
      
      const before = { ...updatedItem }
      updatedItem = applyBatchReplace(updatedItem, rule)
      
      for (const field of rule.targetFields) {
        const oldValue = getFieldValue(before, field)
        const newValue = getFieldValue(updatedItem, field)
        
        if (oldValue !== newValue) {
          changes.push({
            itemId: item.id,
            itemName: item.itemName,
            field,
            oldValue,
            newValue
          })
        }
      }
    }
    
    return updatedItem
  })
  
  return { items: updatedItems, changes }
}

export function previewBatchChanges(
  items: ItemRecord[],
  rules: BatchReplaceRule[]
): Array<{ itemId: string; itemName: string; field: FieldType; oldValue: string; newValue: string }> {
  const { changes } = applyBatchRules(items, rules)
  return changes
}

export const DEFAULT_BATCH_RULES: BatchReplaceRule[] = [
  {
    id: 'rule-1',
    name: '身份证 → 身份证明',
    pattern: '身份证',
    replacement: '身份证明',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true
  },
  {
    id: 'rule-2',
    name: '户口簿 → 户口本',
    pattern: '户口簿',
    replacement: '户口本',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true
  },
  {
    id: 'rule-3',
    name: '工商营业执照 → 营业执照',
    pattern: '工商营业执照',
    replacement: '营业执照',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true
  },
  {
    id: 'rule-4',
    name: '申请书 → 申请表',
    pattern: '申请书',
    replacement: '申请表',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true
  },
  {
    id: 'rule-5',
    name: '删除"相关材料"表述',
    pattern: '相关材料',
    replacement: '（明确具体材料）',
    isRegex: false,
    targetFields: ['materials', 'acceptConditions'],
    enabled: true
  },
  {
    id: 'rule-6',
    name: '删除"有关材料"表述',
    pattern: '有关材料',
    replacement: '（明确具体材料）',
    isRegex: false,
    targetFields: ['materials', 'acceptConditions'],
    enabled: true
  },
  {
    id: 'rule-7',
    name: '规范"工作日"表述',
    pattern: '(\\d+)个?工作?日',
    replacement: '$1个工作日',
    isRegex: true,
    targetFields: ['timeLimit', 'processSteps'],
    enabled: true
  },
  {
    id: 'rule-8',
    name: '删除"等等"表述',
    pattern: '等等',
    replacement: '',
    isRegex: false,
    targetFields: ['acceptConditions', 'materials', 'processSteps', 'specialProcedures'],
    enabled: true
  },
  {
    id: 'rule-9',
    name: '规范电话格式（带区号）',
    pattern: '(\\d{3,4})[- ]?(\\d{7,8})',
    replacement: '$1-$2',
    isRegex: true,
    targetFields: ['consultPhone'],
    enabled: true
  },
  {
    id: 'rule-10',
    name: '统一"申请人"表述',
    pattern: '(当事人|申办人|办理人)',
    replacement: '申请人',
    isRegex: true,
    targetFields: ['acceptConditions', 'processSteps', 'specialProcedures'],
    enabled: true
  }
]

export function normalizeMaterialName(name: string): string {
  const normalizeMap: Record<string, string> = {
    '身份证': '身份证明',
    '居民身份证': '身份证明',
    '本人身份证': '身份证明',
    '身份证件': '身份证明',
    '户口簿': '户口本',
    '户口本原件': '户口本',
    '户口薄': '户口本',
    '户籍证明': '户口本',
    '工商营业执照': '营业执照',
    '企业营业执照': '营业执照',
    '营业执照副本': '营业执照',
    '申请书': '申请表',
    '申请表格': '申请表',
    '书面申请': '申请表',
    '申请报告': '申请表',
    '授权委托书': '委托书',
    '委托授权书': '委托书',
    '代理委托书': '委托书',
    '学历证书': '学历证明',
    '毕业证书': '学历证明',
    '学位证书': '学历证明',
    '毕业证': '学历证明',
    '在职证明': '工作证明',
    '单位证明': '工作证明',
    '用工证明': '工作证明',
    '劳动合同': '工作证明',
    '一寸照片': '照片',
    '免冠照片': '照片',
    '近期照片': '照片',
    '证件照': '照片',
    '房屋所有权证': '房产证',
    '不动产权证': '房产证',
    '产权证明': '房产证',
    '房屋产权证': '房产证'
  }
  
  let normalized = name.trim()
  
  for (const [from, to] of Object.entries(normalizeMap)) {
    if (normalized.includes(from) && !normalized.includes(to)) {
      normalized = normalized.replace(from, to)
    }
  }
  
  return normalized
}

export function generateCorrectionSuggestions(items: ItemRecord[]): Array<{
  itemId: string
  itemName: string
  field: FieldType
  currentValue: string
  suggestedValue: string
  reason: string
}> {
  const suggestions: Array<{
    itemId: string
    itemName: string
    field: FieldType
    currentValue: string
    suggestedValue: string
    reason: string
  }> = []
  
  for (const item of items) {
    for (const material of item.materials) {
      const normalized = normalizeMaterialName(material.name)
      if (normalized !== material.name) {
        suggestions.push({
          itemId: item.id,
          itemName: item.itemName,
          field: 'materials',
          currentValue: material.name,
          suggestedValue: normalized,
          reason: '材料名称规范化'
        })
      }
    }
  }
  
  return suggestions
}
