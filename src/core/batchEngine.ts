import type {
  ItemRecord,
  BatchReplaceRule,
  FieldType
} from '@/types'
import { getFieldValue } from './diffEngine'

const STANDARD_NAMES = [
  '身份证明', '户口本', '营业执照', '申请表', '委托书',
  '学历证明', '工作证明', '照片', '房产证'
]

function isAlreadyNormalized(text: string, target?: string): boolean {
  const normalizedText = text.trim().toLowerCase()
  
  if (target) {
    const normalizedTarget = target.trim().toLowerCase()
    if (normalizedText === normalizedTarget) return true
    
    for (const stdName of STANDARD_NAMES) {
      if (normalizedText.includes(stdName.toLowerCase()) && 
          normalizedTarget.includes(stdName.toLowerCase())) {
        return true
      }
    }
  } else {
    for (const stdName of STANDARD_NAMES) {
      if (normalizedText === stdName.toLowerCase() || 
          normalizedText.includes(stdName.toLowerCase() + '原件') ||
          normalizedText.includes(stdName.toLowerCase() + '复印件')) {
        return true
      }
    }
  }
  
  return false
}

function smartReplace(
  text: string,
  pattern: RegExp | string,
  replacement: string,
  whitelist: string[] = []
): string {
  if (isAlreadyNormalized(text, replacement)) {
    return text
  }

  for (const whiteItem of whitelist) {
    if (whiteItem && text.trim() === whiteItem.trim()) {
      return text
    }
  }
  
  if (pattern instanceof RegExp) {
    let result = text
    for (const whiteItem of whitelist) {
      if (!whiteItem) continue
      const escaped = whiteItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const whitePattern = new RegExp(escaped, 'g')
      result = result.replace(whitePattern, `\x00WHITE\x00${whiteItem}\x00END\x00`)
    }
    
    result = result.replace(pattern, replacement)
    
    result = result.replace(/\x00WHITE\x00(.*?)\x00END\x00/g, '$1')
    return result
  }
  
  let result = text
  for (const whiteItem of whitelist) {
    if (!whiteItem) continue
    const escaped = whiteItem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const whitePattern = new RegExp(escaped, 'g')
    result = result.replace(whitePattern, `\x00WHITE\x00${whiteItem}\x00END\x00`)
  }
  
  const wordBoundaryPattern = new RegExp(
    `(?<![\\u4e00-\\u9fa5a-zA-Z])${pattern}(?![\\u4e00-\\u9fa5a-zA-Z])`,
    'g'
  )
  result = result.replace(wordBoundaryPattern, replacement)
  
  result = result.replace(/\x00WHITE\x00(.*?)\x00END\x00/g, '$1')
  return result
}

export function applyBatchReplace(
  item: ItemRecord,
  rule: BatchReplaceRule
): ItemRecord {
  if (!rule.enabled) return item
  
  const updatedItem = { ...item }
  const pattern = rule.isRegex ? new RegExp(rule.pattern, 'g') : rule.pattern
  const whitelist = rule.whitelist || []
  
  for (const field of rule.targetFields) {
    const newValue = replaceFieldValue(updatedItem, field, pattern, rule.replacement, whitelist)
    ;(updatedItem as any)[field] = newValue
  }
  
  return updatedItem
}

function replaceFieldValue(
  item: ItemRecord,
  field: FieldType,
  pattern: RegExp | string,
  replacement: string,
  whitelist: string[]
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
      return smartReplace(currentValue, pattern, replacement, whitelist)
    
    case 'acceptConditions':
      return item.acceptConditions.map(cond => ({
        ...cond,
        content: smartReplace(cond.content, pattern, replacement, whitelist)
      })) as ItemRecord['acceptConditions']
    
    case 'materials':
      return item.materials.map(mat => ({
        ...mat,
        name: smartReplace(mat.name, pattern, replacement, whitelist),
        notes: mat.notes ? smartReplace(mat.notes, pattern, replacement, whitelist) : mat.notes
      })) as ItemRecord['materials']
    
    case 'processSteps':
      return item.processSteps.map(step => ({
        ...step,
        stepName: smartReplace(step.stepName, pattern, replacement, whitelist),
        description: smartReplace(step.description, pattern, replacement, whitelist),
        handler: smartReplace(step.handler, pattern, replacement, whitelist)
      })) as ItemRecord['processSteps']
    
    case 'specialProcedures':
      return item.specialProcedures.map(proc => ({
        ...proc,
        type: smartReplace(proc.type, pattern, replacement, whitelist),
        condition: smartReplace(proc.condition, pattern, replacement, whitelist),
        description: smartReplace(proc.description, pattern, replacement, whitelist)
      })) as ItemRecord['specialProcedures']
    
    default:
      return item[field]
  }
}

export function testRuleReplace(text: string, rule: BatchReplaceRule): string {
  const pattern = rule.isRegex ? new RegExp(rule.pattern, 'g') : rule.pattern
  return smartReplace(text, pattern, rule.replacement, rule.whitelist || [])
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
    enabled: true,
    whitelist: ['居民身份证', '身份证件', '临时身份证', '二代身份证']
  },
  {
    id: 'rule-2',
    name: '户口簿 → 户口本',
    pattern: '户口簿',
    replacement: '户口本',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true,
    whitelist: ['居民户口簿', '户口薄原件']
  },
  {
    id: 'rule-3',
    name: '工商营业执照 → 营业执照',
    pattern: '工商营业执照',
    replacement: '营业执照',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-4',
    name: '申请书 → 申请表',
    pattern: '申请书',
    replacement: '申请表',
    isRegex: false,
    targetFields: ['materials'],
    enabled: true,
    whitelist: ['申请表格', '书面申请书']
  },
  {
    id: 'rule-5',
    name: '删除"相关材料"表述',
    pattern: '相关材料',
    replacement: '（明确具体材料）',
    isRegex: false,
    targetFields: ['materials', 'acceptConditions'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-6',
    name: '删除"有关材料"表述',
    pattern: '有关材料',
    replacement: '（明确具体材料）',
    isRegex: false,
    targetFields: ['materials', 'acceptConditions'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-7',
    name: '规范"工作日"表述',
    pattern: '(\\d+)个?工作?日',
    replacement: '$1个工作日',
    isRegex: true,
    targetFields: ['timeLimit', 'processSteps'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-8',
    name: '删除"等等"表述',
    pattern: '等等',
    replacement: '',
    isRegex: false,
    targetFields: ['acceptConditions', 'materials', 'processSteps', 'specialProcedures'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-9',
    name: '规范电话格式（带区号）',
    pattern: '(\\d{3,4})[- ]?(\\d{7,8})',
    replacement: '$1-$2',
    isRegex: true,
    targetFields: ['consultPhone'],
    enabled: true,
    whitelist: []
  },
  {
    id: 'rule-10',
    name: '统一"申请人"表述',
    pattern: '(当事人|申办人|办理人)',
    replacement: '申请人',
    isRegex: true,
    targetFields: ['acceptConditions', 'processSteps', 'specialProcedures'],
    enabled: true,
    whitelist: []
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
  
  if (isAlreadyNormalized(normalized, '')) {
    return normalized
  }
  
  for (const [from, to] of Object.entries(normalizeMap)) {
    if (normalized.includes(to)) {
      continue
    }
    if (normalized.includes(from)) {
      const wordBoundaryPattern = new RegExp(
        `(?<![\\u4e00-\\u9fa5a-zA-Z])${from}(?![\\u4e00-\\u9fa5a-zA-Z])`,
        'g'
      )
      normalized = normalized.replace(wordBoundaryPattern, to)
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
