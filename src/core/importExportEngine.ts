import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { v4 as uuidv4 } from 'uuid'
import type {
  ItemRecord,
  ImportSource,
  Issue,
  ReviewReport,
  AcceptCondition
} from '@/types'

const EXCEL_FIELD_MAP: Record<string, keyof ItemRecord> = {
  '事项名称': 'itemName',
  '事项编码': 'itemCode',
  '实施部门': 'department',
  '部门': 'department',
  '受理条件': 'acceptConditions',
  '申请材料': 'materials',
  '办理环节': 'processSteps',
  '特殊程序': 'specialProcedures',
  '承诺时限': 'timeLimit',
  '办理时限': 'timeLimit',
  '收费标准': 'feeStandard',
  '是否收费': 'feeStandard',
  '办理地点': 'handlingLocation',
  '地址': 'handlingLocation',
  '网上办理地址': 'onlineUrl',
  '网上办理': 'onlineUrl',
  '咨询电话': 'consultPhone',
  '联系电话': 'consultPhone'
}

export function importFromExcel(fileContent: ArrayBuffer, fileName: string): { source: ImportSource; items: ItemRecord[] } {
  const workbook = XLSX.read(fileContent, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[]
  
  const sourceId = uuidv4()
  const items: ItemRecord[] = jsonData.map((row, index) => parseExcelRow(row, sourceId, index))
  
  const source: ImportSource = {
    id: sourceId,
    name: fileName,
    type: 'excel',
    importTime: Date.now(),
    itemCount: items.length
  }
  
  return { source, items }
}

function parseExcelRow(row: Record<string, unknown>, sourceId: string, index: number): ItemRecord {
  const item: ItemRecord = {
    id: uuidv4(),
    sourceId,
    itemName: '',
    itemCode: '',
    department: '',
    acceptConditions: [],
    materials: [],
    processSteps: [],
    specialProcedures: [],
    timeLimit: '',
    feeStandard: '',
    handlingLocation: '',
    onlineUrl: '',
    consultPhone: '',
    importTime: Date.now(),
    rawData: row
  }
  
  for (const [excelKey, field] of Object.entries(EXCEL_FIELD_MAP)) {
    const value = row[excelKey]
    if (value === undefined || value === null) continue
    
    const strValue = String(value).trim()
    if (!strValue) continue
    
    switch (field) {
      case 'itemName':
      case 'itemCode':
      case 'department':
      case 'timeLimit':
      case 'feeStandard':
      case 'handlingLocation':
      case 'onlineUrl':
      case 'consultPhone':
        item[field] = strValue
        break
      case 'acceptConditions':
        item.acceptConditions = parseAcceptConditions(strValue)
        break
      case 'materials':
        item.materials = parseMaterials(strValue)
        break
      case 'processSteps':
        item.processSteps = parseProcessSteps(strValue)
        break
      case 'specialProcedures':
        item.specialProcedures = parseSpecialProcedures(strValue)
        break
    }
  }
  
  if (!item.itemName) {
    item.itemName = `未命名事项_${index + 1}`
  }
  
  return item
}

function parseAcceptConditions(text: string): AcceptCondition[] {
  const conditions: AcceptCondition[] = []
  const lines = text.split(/[；;，,\n\r]/).filter(l => l.trim())
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const isNegative = line.includes('不予') || line.includes('不得') || line.includes('不具备') || line.startsWith('✗') || line.startsWith('×')
    
    conditions.push({
      id: uuidv4(),
      content: line.replace(/^[✓✗×]\s*/, ''),
      type: isNegative ? 'negative' : 'positive'
    })
  }
  
  return conditions
}

function parseMaterials(text: string): MaterialItem[] {
  const materials: MaterialItem[] = []
  const lines = text.split(/[；;，,\n\r]/).filter(l => l.trim())
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const isRequired = !line.includes('选填') && !line.includes('可选') && !line.includes('非必填')
    
    const name = line
      .replace(/[(（]必填[)）]/g, '')
      .replace(/[(（]选填[)）]/g, '')
      .replace(/[(（]可选[)）]/g, '')
      .replace(/[(（]非必填[)）]/g, '')
      .trim()
    
    materials.push({
      id: uuidv4(),
      name,
      required: isRequired
    })
  }
  
  return materials
}

function parseProcessSteps(text: string): ProcessStep[] {
  const steps: ProcessStep[] = []
  const stepPatterns = [
    /^(\d+)[、.．]\s*(.+?)[:：]\s*(.+?)\s*[(（](.+?)[，,]\s*(.+?)[)）]/,
    /^(\d+)[、.．]\s*(.+?)[:：]\s*(.+)/,
    /^(.+?)[:：]\s*(.+?)\s*[(（](.+?)[，,]\s*(.+?)[)）]/,
    /^(.+?)[:：]\s*(.+)/
  ]
  
  const lines = text.split(/[→→\n\r]/).filter(l => l.trim())
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    let stepNumber = i + 1
    let stepName = `环节${i + 1}`
    let description = line
    let duration = '即办'
    let handler = '窗口工作人员'
    
    for (const pattern of stepPatterns) {
      const match = line.match(pattern)
      if (match) {
        if (match.length === 6) {
          stepNumber = parseInt(match[1])
          stepName = match[2].trim()
          description = match[3].trim()
          duration = match[4].trim()
          handler = match[5].trim()
        } else if (match.length === 4) {
          if (/^\d+$/.test(match[1])) {
            stepNumber = parseInt(match[1])
            stepName = match[2].trim()
            description = match[3].trim()
          } else {
            stepName = match[1].trim()
            description = match[2].trim()
            duration = match[3]?.trim() || duration
            handler = match[4]?.trim() || handler
          }
        } else if (match.length === 3) {
          if (/^\d+$/.test(match[1])) {
            stepNumber = parseInt(match[1])
            stepName = match[2].trim()
            description = match[3]?.trim() || description
          } else {
            stepName = match[1].trim()
            description = match[2].trim()
          }
        }
        break
      }
    }
    
    steps.push({
      id: uuidv4(),
      stepNumber,
      stepName,
      description,
      duration,
      handler
    })
  }
  
  return steps
}

function parseSpecialProcedures(text: string): SpecialProcedure[] {
  const procedures: SpecialProcedure[] = []
  const lines = text.split(/[；;，,\n\r]/).filter(l => l.trim())
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    const typeMatch = trimmed.match(/^\[(.+?)\]\s*(.+?)[:：]\s*(.+)/)
    
    if (typeMatch) {
      procedures.push({
        id: uuidv4(),
        type: typeMatch[1].trim(),
        condition: typeMatch[2].trim(),
        description: typeMatch[3].trim()
      })
    } else {
      procedures.push({
        id: uuidv4(),
        type: '特别程序',
        condition: '符合条件时',
        description: trimmed
      })
    }
  }
  
  return procedures
}

export function importFromJson(jsonStr: string, fileName: string): { source: ImportSource; items: ItemRecord[] } {
  const data = JSON.parse(jsonStr)
  const itemsData = Array.isArray(data) ? data : (data.items || [])
  
  const sourceId = uuidv4()
  const items: ItemRecord[] = itemsData.map((item: Partial<ItemRecord>, index: number) => ({
    id: uuidv4(),
    sourceId,
    itemName: item.itemName || `未命名事项_${index + 1}`,
    itemCode: item.itemCode || '',
    department: item.department || '',
    acceptConditions: item.acceptConditions || [],
    materials: item.materials || [],
    processSteps: item.processSteps || [],
    specialProcedures: item.specialProcedures || [],
    timeLimit: item.timeLimit || '',
    feeStandard: item.feeStandard || '',
    handlingLocation: item.handlingLocation || '',
    onlineUrl: item.onlineUrl || '',
    consultPhone: item.consultPhone || '',
    version: item.version,
    importTime: Date.now(),
    rawData: item
  }))
  
  const source: ImportSource = {
    id: sourceId,
    name: fileName,
    type: 'json',
    importTime: Date.now(),
    itemCount: items.length
  }
  
  return { source, items }
}

export function importFromText(text: string, sourceName: string): { source: ImportSource; items: ItemRecord[] } {
  const items: ItemRecord[] = []
  const sourceId = uuidv4()
  
  const itemBlocks = text.split(/\n\s*\n/).filter(b => b.trim())
  
  for (let i = 0; i < itemBlocks.length; i++) {
    const block = itemBlocks[i].trim()
    const lines = block.split('\n').map(l => l.trim()).filter(l => l)
    
    const item: ItemRecord = {
      id: uuidv4(),
      sourceId,
      itemName: '',
      itemCode: '',
      department: '',
      acceptConditions: [],
      materials: [],
      processSteps: [],
      specialProcedures: [],
      timeLimit: '',
      feeStandard: '',
      handlingLocation: '',
      onlineUrl: '',
      consultPhone: '',
      importTime: Date.now()
    }
    
    let currentField: string | null = null
    let fieldValue = ''
    
    for (const line of lines) {
      const fieldMatch = line.match(/^(.+?)[:：]\s*(.*)$/)
      
      if (fieldMatch) {
        if (currentField && fieldValue) {
          setFieldValue(item, currentField, fieldValue.trim())
        }
        
        currentField = fieldMatch[1].trim()
        fieldValue = fieldMatch[2]
      } else if (currentField) {
        fieldValue += '\n' + line
      }
    }
    
    if (currentField && fieldValue) {
      setFieldValue(item, currentField, fieldValue.trim())
    }
    
    if (!item.itemName) {
      item.itemName = lines[0] || `未命名事项_${i + 1}`
    }
    
    items.push(item)
  }
  
  const source: ImportSource = {
    id: sourceId,
    name: sourceName,
    type: 'text',
    importTime: Date.now(),
    itemCount: items.length
  }
  
  return { source, items }
}

function setFieldValue(item: ItemRecord, fieldName: string, value: string): void {
  const field = EXCEL_FIELD_MAP[fieldName]
  if (!field) return
  
  switch (field) {
    case 'itemName':
    case 'itemCode':
    case 'department':
    case 'timeLimit':
    case 'feeStandard':
    case 'handlingLocation':
    case 'onlineUrl':
    case 'consultPhone':
      item[field] = value
      break
    case 'acceptConditions':
      item.acceptConditions = parseAcceptConditions(value)
      break
    case 'materials':
      item.materials = parseMaterials(value)
      break
    case 'processSteps':
      item.processSteps = parseProcessSteps(value)
      break
    case 'specialProcedures':
      item.specialProcedures = parseSpecialProcedures(value)
      break
  }
}

export function exportToExcel(items: ItemRecord[], issues: Issue[], fileName: string): void {
  const itemData = items.map(item => ({
    '事项名称': item.itemName,
    '事项编码': item.itemCode,
    '实施部门': item.department,
    '受理条件': item.acceptConditions.map(c => `${c.type === 'positive' ? '✓' : '✗'} ${c.content}`).join('；'),
    '申请材料': item.materials.map(m => `${m.name}${m.required ? '(必填)' : '(选填)'}`).join('；'),
    '办理环节': item.processSteps.sort((a, b) => a.stepNumber - b.stepNumber).map(s => `${s.stepNumber}. ${s.stepName}：${s.description}`).join(' → '),
    '特殊程序': item.specialProcedures.map(p => `[${p.type}] ${p.condition}：${p.description}`).join('；'),
    '承诺时限': item.timeLimit,
    '收费标准': item.feeStandard,
    '办理地点': item.handlingLocation,
    '网上办理地址': item.onlineUrl,
    '咨询电话': item.consultPhone
  }))
  
  const issueData = issues.map(issue => ({
    '事项名称': issue.itemName,
    '问题类型': issue.type,
    '严重程度': issue.severity,
    '涉及字段': issue.field || '',
    '问题描述': issue.description,
    '整改建议': issue.suggestion,
    '原值': issue.oldValue || '',
    '建议值': issue.newValue || '',
    '状态': issue.status,
    '创建时间': new Date(issue.createTime).toLocaleString()
  }))
  
  const wb = XLSX.utils.book_new()
  const itemWs = XLSX.utils.json_to_sheet(itemData)
  const issueWs = XLSX.utils.json_to_sheet(issueData)
  
  XLSX.utils.book_append_sheet(wb, itemWs, '事项清单')
  XLSX.utils.book_append_sheet(wb, issueWs, '问题清单')
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const data = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(data, fileName)
}

export function exportToJson(items: ItemRecord[], fileName: string): void {
  const dataStr = JSON.stringify(items, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  saveAs(blob, fileName)
}

export function exportReport(report: ReviewReport, items: ItemRecord[], format: 'excel' | 'json' | 'html'): void {
  const timestamp = new Date().toISOString().slice(0, 10)
  const fileName = `审校报告_${timestamp}`
  
  if (format === 'excel') {
    exportToExcel(items, report.details, `${fileName}.xlsx`)
  } else if (format === 'json') {
    exportToJson(items, `${fileName}.json`)
  } else if (format === 'html') {
    const html = generateHtmlReport(report)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    saveAs(blob, `${fileName}.html`)
  }
}

function generateHtmlReport(report: ReviewReport): string {
  const issueTypeLabels: Record<string, string> = {
    field_diff: '字段差异',
    condition_conflict: '受理条件冲突',
    material_inconsistent: '材料名称不规范',
    step_duplicate: '办理环节重复',
    special_missing: '特殊程序缺漏',
    format_issue: '格式问题',
    expression_unstandard: '表述不规范',
    cross_department_inconsistent: '跨部门不一致'
  }
  
  const severityColors: Record<string, string> = {
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#06b6d4'
  }
  
  const issuesByTypeHtml = Object.entries(report.issuesByType)
    .map(([type, count]) => `
      <div class="stat-item">
        <div class="stat-label">${issueTypeLabels[type] || type}</div>
        <div class="stat-value">${count}</div>
      </div>
    `).join('')
  
  const issuesByDeptHtml = Object.entries(report.issuesByDepartment)
    .map(([dept, count]) => `
      <div class="stat-item">
        <div class="stat-label">${dept || '未分类'}</div>
        <div class="stat-value">${count}</div>
      </div>
    `).join('')
  
  const detailsHtml = report.details
    .map(issue => `
      <div class="issue-card severity-${issue.severity}">
        <div class="issue-header">
          <span class="issue-item">${issue.itemName}</span>
          <span class="issue-type" style="background: ${severityColors[issue.severity]}">${issueTypeLabels[issue.type] || issue.type}</span>
        </div>
        <div class="issue-body">
          <p><strong>问题描述：</strong>${issue.description}</p>
          <p><strong>整改建议：</strong>${issue.suggestion}</p>
          ${issue.oldValue ? `<p><strong>原值：</strong><span class="old-value">${issue.oldValue}</span></p>` : ''}
          ${issue.newValue ? `<p><strong>建议值：</strong><span class="new-value">${issue.newValue}</span></p>` : ''}
        </div>
      </div>
    `).join('')
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>实施清单审校报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 1200px; margin: 0 auto; padding: 40px 20px; background: #f5f7fa; color: #333; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
    .header h1 { font-size: 28px; color: #1e3a8a; margin-bottom: 10px; }
    .header .date { color: #666; }
    .summary { background: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .summary h2 { color: #1e3a8a; margin-bottom: 15px; font-size: 20px; }
    .summary p { line-height: 1.8; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-card .label { color: #666; font-size: 14px; margin-bottom: 8px; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .section { background: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section h2 { color: #1e3a8a; margin-bottom: 20px; font-size: 20px; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
    .stat-item { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-item .stat-label { color: #666; font-size: 12px; margin-bottom: 5px; }
    .stat-item .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .issue-card { border-left: 4px solid; margin-bottom: 15px; background: #fafafa; border-radius: 4px; overflow: hidden; }
    .issue-card.severity-error { border-left-color: #dc2626; }
    .issue-card.severity-warning { border-left-color: #f59e0b; }
    .issue-card.severity-info { border-left-color: #06b6d4; }
    .issue-header { background: #f1f5f9; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; }
    .issue-item { font-weight: bold; color: #1e3a8a; }
    .issue-type { color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
    .issue-body { padding: 15px; }
    .issue-body p { margin-bottom: 8px; line-height: 1.6; font-size: 14px; }
    .old-value { color: #dc2626; text-decoration: line-through; }
    .new-value { color: #16a34a; font-weight: bold; }
    .footer { text-align: center; color: #999; padding: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>实施清单审校报告</h1>
    <div class="date">生成时间：${new Date(report.createTime).toLocaleString()}</div>
  </div>
  
  <div class="summary">
    <h2>审校概要</h2>
    <p>${report.summary}</p>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">事项总数</div>
      <div class="value">${report.totalItems}</div>
    </div>
    <div class="stat-card">
      <div class="label">已审校事项</div>
      <div class="value">${report.reviewedItems}</div>
    </div>
    <div class="stat-card">
      <div class="label">问题总数</div>
      <div class="value">${report.totalIssues}</div>
    </div>
    <div class="stat-card">
      <div class="label">已解决问题</div>
      <div class="value">${report.resolvedIssues}</div>
    </div>
  </div>
  
  <div class="section">
    <h2>问题类型分布</h2>
    <div class="stats-row">
      ${issuesByTypeHtml}
    </div>
  </div>
  
  <div class="section">
    <h2>部门问题分布</h2>
    <div class="stats-row">
      ${issuesByDeptHtml}
    </div>
  </div>
  
  <div class="section">
    <h2>问题详情</h2>
    ${detailsHtml}
  </div>
  
  <div class="footer">
    本报告由实施清单审校工具自动生成
  </div>
</body>
</html>
  `
}

export function generateReviewReport(
  items: ItemRecord[],
  issues: Issue[],
  summary?: string
): ReviewReport {
  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const issuesByDepartment = issues.reduce((acc, issue) => {
    const item = items.find(i => i.id === issue.itemId)
    const dept = item?.department || '未分类'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const resolvedIssues = issues.filter(i => i.status === 'resolved').length
  const reviewedItems = new Set(issues.map(i => i.itemId)).size
  
  const defaultSummary = `
    本次审校共涉及 ${items.length} 个事项，已完成审校 ${reviewedItems} 个事项，
    发现问题 ${issues.length} 个，其中已解决 ${resolvedIssues} 个，
    待处理 ${issues.length - resolvedIssues} 个。
    问题主要集中在 ${Object.entries(issuesByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${type}(${count}个)`)
      .join('、')} 等方面。
  `.trim()
  
  return {
    id: uuidv4(),
    createTime: Date.now(),
    totalItems: items.length,
    reviewedItems,
    totalIssues: issues.length,
    resolvedIssues,
    issuesByType: issuesByType as ReviewReport['issuesByType'],
    issuesByDepartment,
    details: issues,
    summary: summary || defaultSummary
  }
}
