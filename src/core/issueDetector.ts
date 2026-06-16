import { v4 as uuidv4 } from 'uuid'
import type {
  ItemRecord,
  Issue,
  IssueType,
  IssueSeverity,
  AcceptCondition,
  FieldType
} from '@/types'

function createIssue(
  item: ItemRecord,
  type: IssueType,
  severity: IssueSeverity,
  description: string,
  suggestion: string,
  field?: FieldType,
  oldValue?: string,
  newValue?: string
): Issue {
  return {
    id: uuidv4(),
    itemId: item.id,
    itemName: item.itemName,
    type,
    severity,
    field,
    description,
    suggestion,
    oldValue,
    newValue,
    status: 'pending',
    createTime: Date.now()
  }
}

export function detectConditionConflicts(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  const conditions = item.acceptConditions

  const conflicts: Array<[AcceptCondition, AcceptCondition, string]> = []
  
  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      const a = conditions[i]
      const b = conditions[j]
      
      if (a.type !== b.type) {
        const contentA = a.content.replace(/\s+/g, '')
        const contentB = b.content.replace(/\s+/g, '')
        
        if (contentA === contentB || 
            contentA.includes(contentB) || 
            contentB.includes(contentA)) {
          conflicts.push([a, b, `同一条件存在正反两种表述`])
        }
      }
      
      const contradictionPatterns = [
        ['具有完全民事行为能力', '无民事行为能力或者限制民事行为能力'],
        ['身体健康', '患有特定疾病'],
        ['年满18周岁', '未满18周岁'],
        ['本市户籍', '非本市户籍']
      ]
      
      for (const [patA, patB] of contradictionPatterns) {
        const aHasA = a.content.includes(patA)
        const aHasB = a.content.includes(patB)
        const bHasA = b.content.includes(patA)
        const bHasB = b.content.includes(patB)
        
        if ((aHasA && bHasB) || (aHasB && bHasA)) {
          conflicts.push([a, b, `受理条件存在逻辑矛盾："${patA}"与"${patB}"并存`])
        }
      }
    }
  }
  
  for (const [a, b, reason] of conflicts) {
    issues.push(createIssue(
      item,
      'condition_conflict',
      'error',
      `${reason}："${a.content}" 与 "${b.content}"`,
      '建议统一受理条件表述，删除矛盾条款，明确适用情形',
      'acceptConditions',
      a.content,
      b.content
    ))
  }
  
  return issues
}

export function detectMaterialIssues(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  const materials = item.materials
  
  const standardMaterialNames: Record<string, string[]> = {
    '身份证明': ['身份证', '居民身份证', '本人身份证', '身份证件'],
    '户口本': ['户口簿', '户口本原件', '户口薄', '户籍证明'],
    '营业执照': ['工商营业执照', '企业营业执照', '营业执照副本'],
    '申请表': ['申请书', '申请表格', '书面申请', '申请报告'],
    '委托书': ['授权委托书', '委托授权书', '代理委托书'],
    '学历证明': ['学历证书', '毕业证书', '学位证书', '毕业证'],
    '工作证明': ['在职证明', '单位证明', '用工证明', '劳动合同'],
    '照片': ['一寸照片', '免冠照片', '近期照片', '证件照'],
    '房产证': ['房屋所有权证', '不动产权证', '产权证明', '房屋产权证']
  }
  
  for (const material of materials) {
    for (const [standard, variants] of Object.entries(standardMaterialNames)) {
      for (const variant of variants) {
        if (material.name.includes(variant) && !material.name.includes(standard)) {
          const suggestion = `建议将"${material.name}"规范为"${standard}"`
          
          const alreadyExists = materials.some(
            m => m.id !== material.id && m.name.includes(standard)
          )
          
          if (!alreadyExists) {
            issues.push(createIssue(
              item,
              'material_inconsistent',
              'warning',
              `材料名称不规范："${material.name}"建议使用标准名称"${standard}"`,
              suggestion,
              'materials',
              material.name,
              standard
            ))
          }
          break
        }
      }
    }
    
    const vaguePatterns = ['相关材料', '有关材料', '相应材料', '其他材料', '等材料']
    for (const pattern of vaguePatterns) {
      if (material.name.includes(pattern)) {
        issues.push(createIssue(
          item,
          'material_inconsistent',
          'error',
          `材料名称模糊："${material.name}"未明确具体材料`,
          '建议明确列出所需的具体材料名称，避免使用模糊表述',
          'materials',
          material.name
        ))
      }
    }
  }
  
  return issues
}

export function detectStepDuplicates(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  const steps = item.processSteps
  
  for (let i = 0; i < steps.length; i++) {
    for (let j = i + 1; j < steps.length; j++) {
      const a = steps[i]
      const b = steps[j]
      
      const aName = a.stepName.replace(/\s+/g, '')
      const bName = b.stepName.replace(/\s+/g, '')
      
      if (aName === bName) {
        issues.push(createIssue(
          item,
          'step_duplicate',
          'warning',
          `办理环节重复：第${a.stepNumber}步"${a.stepName}"与第${b.stepNumber}步"${b.stepName}"名称相同`,
          '建议合并重复环节，或明确区分两个环节的不同职责',
          'processSteps',
          `第${a.stepNumber}步：${a.stepName}`,
          `第${b.stepNumber}步：${b.stepName}`
        ))
      }
      
      const aDesc = a.description.replace(/\s+/g, '')
      const bDesc = b.description.replace(/\s+/g, '')
      
      if (aDesc === bDesc && aDesc.length > 10) {
        issues.push(createIssue(
          item,
          'step_duplicate',
          'warning',
          `办理环节内容重复：第${a.stepNumber}步与第${b.stepNumber}步描述内容相同`,
          '建议检查办理流程，合并内容重复的环节',
          'processSteps',
          a.description,
          b.description
        ))
      }
    }
  }
  
  const stepNumbers = steps.map(s => s.stepNumber).sort((a, b) => a - b)
  for (let i = 1; i < stepNumbers.length; i++) {
    if (stepNumbers[i] - stepNumbers[i - 1] > 1) {
      issues.push(createIssue(
        item,
        'format_issue',
        'info',
        `办理环节编号不连续：从${stepNumbers[i - 1]}跳转到${stepNumbers[i]}`,
        '建议检查环节编号，确保序号连续',
        'processSteps'
      ))
    }
  }
  
  return issues
}

export function detectSpecialProcedureMissing(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  
  const itemContent = JSON.stringify(item).toLowerCase()
  
  const expectedProcedures: string[] = []
  
  if (itemContent.includes('涉及公共利益') || itemContent.includes('重大利益')) {
    expectedProcedures.push('听证')
  }
  if (itemContent.includes('有限自然资源') || itemContent.includes('公共资源') || itemContent.includes('特许经营')) {
    expectedProcedures.push('招标')
    expectedProcedures.push('拍卖')
  }
  if (itemContent.includes('专业技术') || itemContent.includes('技术标准') || itemContent.includes('技术规范')) {
    expectedProcedures.push('检验')
    expectedProcedures.push('检测')
    expectedProcedures.push('专家评审')
  }
  
  const existingTypes = item.specialProcedures.map(p => p.type)
  
  for (const expected of expectedProcedures) {
    const hasProcedure = existingTypes.some(t => 
      t.includes(expected) || expected.includes(t)
    )
    
    if (!hasProcedure && item.specialProcedures.length === 0) {
      issues.push(createIssue(
        item,
        'special_missing',
        'warning',
        `特殊程序缺漏：根据事项内容，可能需要设置"${expected}"特殊程序`,
        '建议对照行政许可法相关规定，补充完善特殊程序条款',
        'specialProcedures',
        '无特殊程序',
        expected
      ))
    }
  }
  
  if (item.specialProcedures.length === 0 && expectedProcedures.length === 0) {
    const generalKeywords = ['行政许可', '审批', '核准']
    if (generalKeywords.some(k => item.itemName.includes(k))) {
      const hasGeneralSpecial = item.specialProcedures.length > 0
      if (!hasGeneralSpecial) {
        issues.push(createIssue(
          item,
          'special_missing',
          'info',
          `特殊程序未设置：请确认是否需要设置特别程序`,
          '根据行政许可法，检验、检测、检疫、鉴定和专家评审等所需时间不计算在许可期限内，如有请补充',
          'specialProcedures'
        ))
      }
    }
  }
  
  return issues
}

export function detectFormatIssues(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  
  const phonePattern = /^(0\d{2,3}-?\d{7,8}|1[3-9]\d{9})$/
  if (item.consultPhone && !phonePattern.test(item.consultPhone.replace(/\s+/g, ''))) {
    issues.push(createIssue(
      item,
      'format_issue',
      'warning',
      `咨询电话格式不规范："${item.consultPhone}"`,
      '建议使用规范格式：固定电话如"010-12345678"，移动电话如"13812345678"',
      'consultPhone',
      item.consultPhone
    ))
  }
  
  const timeLimitPattern = /^(\d+个工作日|\d+天|即办|当场办理)$/
  if (item.timeLimit && !timeLimitPattern.test(item.timeLimit)) {
    issues.push(createIssue(
      item,
      'format_issue',
      'warning',
      `承诺时限格式不规范："${item.timeLimit}"`,
      '建议使用规范格式：如"5个工作日"、"15天"、"即办"',
      'timeLimit',
      item.timeLimit
    ))
  }
  
  const urlPattern = /^https?:\/\/.+/
  if (item.onlineUrl && !urlPattern.test(item.onlineUrl)) {
    issues.push(createIssue(
      item,
      'format_issue',
      'warning',
      `网上办理地址格式不规范："${item.onlineUrl}"`,
      '建议使用完整的URL格式，以http://或https://开头',
      'onlineUrl',
      item.onlineUrl
    ))
  }
  
  return issues
}

export function detectExpressionIssues(item: ItemRecord): Issue[] {
  const issues: Issue[] = []
  
  const unstandardExpressions: Array<{pattern: RegExp; suggestion: string; severity: IssueSeverity}> = [
    { pattern: /等等/, suggestion: '建议避免使用"等等"，应明确具体范围', severity: 'info' },
    { pattern: /等相关/, suggestion: '建议避免使用"等相关"，应明确具体内容', severity: 'info' },
    { pattern: /原则上/, suggestion: '建议避免使用"原则上"，应明确具体规则', severity: 'warning' },
    { pattern: /一般情况下/, suggestion: '建议避免使用"一般情况下"，应明确适用条件', severity: 'info' },
    { pattern: /视情况/, suggestion: '建议避免使用"视情况"，应明确判定标准', severity: 'warning' },
    { pattern: /适当/, suggestion: '建议避免使用"适当"，应明确具体标准', severity: 'info' },
    { pattern: /相应/, suggestion: '建议避免使用"相应"，应明确具体内容', severity: 'info' },
    { pattern: /有关/, suggestion: '建议避免使用"有关"，应明确具体指向', severity: 'info' },
    { pattern: /材料齐全/, suggestion: '建议将"材料齐全"明确为具体的材料清单', severity: 'warning' },
    { pattern: /符合条件/, suggestion: '建议将"符合条件"明确为具体的条件内容', severity: 'warning' }
  ]
  
  const textFields: FieldType[] = ['acceptConditions', 'materials', 'processSteps', 'specialProcedures', 'feeStandard', 'handlingLocation']
  
  for (const field of textFields) {
    let fieldText = ''
    
    switch (field) {
      case 'acceptConditions':
        fieldText = item.acceptConditions.map(c => c.content).join(' ')
        break
      case 'materials':
        fieldText = item.materials.map(m => m.name + (m.notes || '')).join(' ')
        break
      case 'processSteps':
        fieldText = item.processSteps.map(s => s.stepName + s.description).join(' ')
        break
      case 'specialProcedures':
        fieldText = item.specialProcedures.map(p => p.description).join(' ')
        break
      case 'feeStandard':
        fieldText = item.feeStandard
        break
      case 'handlingLocation':
        fieldText = item.handlingLocation
        break
    }
    
    for (const { pattern, suggestion, severity } of unstandardExpressions) {
      const matches = fieldText.match(pattern)
      if (matches) {
        issues.push(createIssue(
          item,
          'expression_unstandard',
          severity,
          `${field}中存在不规范表述："${matches[0]}"`,
          suggestion,
          field,
          matches[0]
        ))
      }
    }
  }
  
  return issues
}

export function detectAllIssues(item: ItemRecord): Issue[] {
  return [
    ...detectConditionConflicts(item),
    ...detectMaterialIssues(item),
    ...detectStepDuplicates(item),
    ...detectSpecialProcedureMissing(item),
    ...detectFormatIssues(item),
    ...detectExpressionIssues(item)
  ]
}

export function detectIssuesForItems(items: ItemRecord[]): Issue[] {
  const allIssues: Issue[] = []
  
  for (const item of items) {
    allIssues.push(...detectAllIssues(item))
  }
  
  allIssues.push(...detectCrossDepartmentIssues(items))
  
  return allIssues
}

export function detectCrossDepartmentIssues(items: ItemRecord[]): Issue[] {
  const issues: Issue[] = []
  
  const groupedByName = new Map<string, ItemRecord[]>()
  for (const item of items) {
    const key = item.itemName.trim()
    if (!groupedByName.has(key)) {
      groupedByName.set(key, [])
    }
    groupedByName.get(key)!.push(item)
  }
  
  for (const [name, groupItems] of groupedByName) {
    if (groupItems.length > 1) {
      const departments = [...new Set(groupItems.map(i => i.department))]
      
      if (departments.length > 1) {
        for (const item of groupItems) {
          issues.push(createIssue(
            item,
            'cross_department_inconsistent',
            'warning',
            `跨部门事项不一致："${name}"在${departments.join('、')}等部门均有设置，建议确认是否需统一标准`,
            '建议协调相关部门统一事项标准，明确主办部门，避免重复或标准不一',
            'department',
            item.department,
            departments.filter(d => d !== item.department).join('、')
          ))
        }
      }
    }
  }
  
  return issues
}
