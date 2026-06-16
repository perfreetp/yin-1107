export type SourceType = 'excel' | 'json' | 'text' | 'clipboard' | 'demo'

export type FieldType = 
  | 'itemName'
  | 'itemCode'
  | 'department'
  | 'acceptConditions'
  | 'materials'
  | 'processSteps'
  | 'specialProcedures'
  | 'timeLimit'
  | 'feeStandard'
  | 'handlingLocation'
  | 'onlineUrl'
  | 'consultPhone'

export type IssueType = 
  | 'field_diff'
  | 'condition_conflict'
  | 'material_inconsistent'
  | 'step_duplicate'
  | 'special_missing'
  | 'format_issue'
  | 'expression_unstandard'
  | 'cross_department_inconsistent'

export type IssueSeverity = 'error' | 'warning' | 'info'

export type ReviewStatus = 'pending' | 'reviewing' | 'resolved' | 'ignored'

export type WorkspaceType = 'import' | 'compare' | 'batch' | 'issues' | 'export'

export interface MaterialItem {
  id: string
  name: string
  required: boolean
  format?: string
  notes?: string
}

export interface ProcessStep {
  id: string
  stepNumber: number
  stepName: string
  description: string
  duration: string
  handler: string
}

export interface SpecialProcedure {
  id: string
  type: string
  condition: string
  description: string
}

export interface AcceptCondition {
  id: string
  content: string
  type: 'positive' | 'negative'
}

export interface ItemRecord {
  id: string
  sourceId: string
  itemName: string
  itemCode: string
  department: string
  acceptConditions: AcceptCondition[]
  materials: MaterialItem[]
  processSteps: ProcessStep[]
  specialProcedures: SpecialProcedure[]
  timeLimit: string
  feeStandard: string
  handlingLocation: string
  onlineUrl: string
  consultPhone: string
  version?: string
  importTime: number
  rawData?: Record<string, unknown>
}

export interface ImportSource {
  id: string
  name: string
  type: SourceType
  importTime: number
  itemCount: number
  filePath?: string
}

export interface FieldDiff {
  field: FieldType
  oldValue: string
  newValue: string
  diffSegments: DiffSegment[]
}

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged'
  value: string
}

export interface Issue {
  id: string
  itemId: string
  itemName: string
  type: IssueType
  severity: IssueSeverity
  field?: FieldType
  description: string
  suggestion: string
  oldValue?: string
  newValue?: string
  status: ReviewStatus
  createTime: number
  resolveTime?: number
}

export interface BatchReplaceRule {
  id: string
  name: string
  pattern: string
  replacement: string
  isRegex: boolean
  targetFields: FieldType[]
  enabled: boolean
}

export interface CompareResult {
  itemId: string
  itemName: string
  fieldDiffs: FieldDiff[]
  issues: Issue[]
  hasDifferences: boolean
  hasConflicts: boolean
}

export interface ReviewReport {
  id: string
  createTime: number
  totalItems: number
  reviewedItems: number
  totalIssues: number
  resolvedIssues: number
  issuesByType: Record<IssueType, number>
  issuesByDepartment: Record<string, number>
  details: Issue[]
  summary: string
}

export interface AppState {
  sources: ImportSource[]
  items: ItemRecord[]
  selectedItemId: string | null
  compareItemIds: [string, string] | null
  issues: Issue[]
  batchRules: BatchReplaceRule[]
  currentWorkspace: WorkspaceType
  filterType: IssueType | 'all'
  filterDepartment: string
  filterSeverity: IssueSeverity | 'all'
}

export const FIELD_LABELS: Record<FieldType, string> = {
  itemName: '事项名称',
  itemCode: '事项编码',
  department: '实施部门',
  acceptConditions: '受理条件',
  materials: '申请材料',
  processSteps: '办理环节',
  specialProcedures: '特殊程序',
  timeLimit: '承诺时限',
  feeStandard: '收费标准',
  handlingLocation: '办理地点',
  onlineUrl: '网上办理地址',
  consultPhone: '咨询电话'
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  field_diff: '字段差异',
  condition_conflict: '受理条件冲突',
  material_inconsistent: '材料名称不规范',
  step_duplicate: '办理环节重复',
  special_missing: '特殊程序缺漏',
  format_issue: '格式问题',
  expression_unstandard: '表述不规范',
  cross_department_inconsistent: '跨部门不一致'
}

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  error: '严重',
  warning: '警告',
  info: '提示'
}

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '待处理',
  reviewing: '处理中',
  resolved: '已解决',
  ignored: '已忽略'
}

export const WORKSPACE_LABELS: Record<WorkspaceType, string> = {
  import: '导入区',
  compare: '双栏比对区',
  batch: '批量处理区',
  issues: '问题清单区',
  export: '导出区'
}
