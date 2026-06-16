import { useState, useMemo } from 'react'
import {
  AlertCircle, Check, Filter, RefreshCw, Eye,
  CheckCircle2, Clock, Ban, ChevronDown, Search,
  BarChart3, PieChart, Users
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { IssueTypeBadge } from '@/components/common/IssueTypeBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { FIELD_LABELS, ISSUE_TYPE_LABELS, ISSUE_SEVERITY_LABELS, type IssueType, type IssueSeverity } from '@/types'

export function IssuesWorkspace() {
  const { state, updateIssueStatus, batchUpdateIssueStatus, setFilterType, setFilterSeverity, setFilterDepartment, runDetection, getFilteredIssues, getDepartments } = useApp()
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showDeptFilter, setShowDeptFilter] = useState(false)

  const filteredIssues = useMemo(() => {
    const issues = getFilteredIssues()
    if (!searchText.trim()) return issues
    
    const search = searchText.toLowerCase()
    return issues.filter(issue =>
      issue.itemName.toLowerCase().includes(search) ||
      issue.description.toLowerCase().includes(search) ||
      issue.suggestion.toLowerCase().includes(search)
    )
  }, [getFilteredIssues, searchText])

  const selectedIssue = useMemo(() => {
    return state.issues.find(i => i.id === selectedIssueId) || null
  }, [state.issues, selectedIssueId])

  const stats = useMemo(() => {
    const total = state.issues.length
    const byType = state.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const bySeverity = state.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const byStatus = state.issues.reduce((acc, issue) => {
      acc[issue.status] = (acc[issue.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return { total, byType, bySeverity, byStatus }
  }, [state.issues])

  const departments = getDepartments()

  const issueTypes: IssueType[] = [
    'field_diff', 'condition_conflict', 'material_inconsistent',
    'step_duplicate', 'special_missing', 'format_issue',
    'expression_unstandard', 'cross_department_inconsistent'
  ]

  const severities: IssueSeverity[] = ['error', 'warning', 'info']

  const handleBatchResolve = () => {
    const pendingIds = filteredIssues
      .filter(i => i.status === 'pending')
      .map(i => i.id)
    if (pendingIds.length === 0) {
      alert('没有待处理的问题')
      return
    }
    if (confirm(`确定要将 ${pendingIds.length} 个待处理问题标记为已解决吗？`)) {
      batchUpdateIssueStatus(pendingIds, 'resolved')
    }
  }

  const handleBatchIgnore = () => {
    const pendingIds = filteredIssues
      .filter(i => i.status === 'pending')
      .map(i => i.id)
    if (pendingIds.length === 0) {
      alert('没有待处理的问题')
      return
    }
    if (confirm(`确定要忽略 ${pendingIds.length} 个待处理问题吗？`)) {
      batchUpdateIssueStatus(pendingIds, 'ignored')
    }
  }

  if (state.issues.length === 0 && state.items.length > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">尚未检测问题</p>
        <p className="text-sm mt-2">点击下方按钮开始检测</p>
        <button
          onClick={runDetection}
          className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          开始检测
        </button>
      </div>
    )
  }

  if (state.items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-2">请先在导入区导入事项数据</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">问题清单</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={runDetection}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重新检测
            </button>
            <button
              onClick={handleBatchResolve}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              批量解决
            </button>
            <button
              onClick={handleBatchIgnore}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              <Ban className="w-4 h-4" />
              批量忽略
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>问题总数</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>严重问题</span>
            </div>
            <div className="text-2xl font-bold text-red-700">{stats.bySeverity.error || 0}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>待处理</span>
            </div>
            <div className="text-2xl font-bold text-amber-700">{stats.byStatus.pending || 0}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
              <Check className="w-4 h-4" />
              <span>已解决</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.byStatus.resolved || 0}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索问题内容..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowTypeFilter(!showTypeFilter); setShowDeptFilter(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                state.filterType !== 'all'
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {state.filterType === 'all' ? '问题类型' : ISSUE_TYPE_LABELS[state.filterType]}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showTypeFilter && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                <button
                  onClick={() => { setFilterType('all'); setShowTypeFilter(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    state.filterType === 'all' ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  全部类型
                </button>
                {issueTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setShowTypeFilter(false) }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      state.filterType === type ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    {ISSUE_TYPE_LABELS[type]} ({stats.byType[type] || 0})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowDeptFilter(!showDeptFilter); setShowTypeFilter(false) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                state.filterDepartment
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4" />
              {state.filterDepartment || '部门筛选'}
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showDeptFilter && departments.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                <button
                  onClick={() => { setFilterDepartment(''); setShowDeptFilter(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    !state.filterDepartment ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  全部部门
                </button>
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => { setFilterDepartment(dept); setShowDeptFilter(false) }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                      state.filterDepartment === dept ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {severities.map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(state.filterSeverity === sev ? 'all' : sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  state.filterSeverity === sev
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {ISSUE_SEVERITY_LABELS[sev]}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-500 ml-auto">
            显示 {filteredIssues.length} / {state.issues.length} 个问题
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 overflow-auto">
          {filteredIssues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Filter className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg">没有符合条件的问题</p>
              <p className="text-sm mt-1">请调整筛选条件</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredIssues.map(issue => (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedIssueId === issue.id
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-800 text-sm flex-1">
                      {issue.itemName}
                    </h4>
                    <StatusBadge status={issue.status} size="sm" />
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={issue.severity} size="sm" />
                    <IssueTypeBadge type={issue.type} size="sm" />
                    {issue.field && (
                      <span className="text-xs text-gray-500">
                        {FIELD_LABELS[issue.field]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-1/2 overflow-auto bg-gray-50">
          {!selectedIssue ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
              <Eye className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg">选择一个问题查看详情</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">{selectedIssue.itemName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <SeverityBadge severity={selectedIssue.severity} />
                    <IssueTypeBadge type={selectedIssue.type} />
                    <StatusBadge status={selectedIssue.status} />
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">问题描述</h4>
                    <p className="text-sm text-gray-600 bg-red-50 border border-red-100 rounded-lg p-3">
                      {selectedIssue.description}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">整改建议</h4>
                    <p className="text-sm text-gray-600 bg-green-50 border border-green-100 rounded-lg p-3">
                      {selectedIssue.suggestion}
                    </p>
                  </div>
                  
                  {selectedIssue.oldValue && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">原值</h4>
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 line-through">
                        {selectedIssue.oldValue}
                      </p>
                    </div>
                  )}
                  
                  {selectedIssue.newValue && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">建议值</h4>
                      <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-3 font-medium">
                        {selectedIssue.newValue}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <p>创建时间：{new Date(selectedIssue.createTime).toLocaleString()}</p>
                    {selectedIssue.resolveTime && (
                      <p>解决时间：{new Date(selectedIssue.resolveTime).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                  {selectedIssue.status !== 'resolved' && (
                    <button
                      onClick={() => updateIssueStatus(selectedIssue.id, 'resolved')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      标记为已解决
                    </button>
                  )}
                  {selectedIssue.status !== 'ignored' && (
                    <button
                      onClick={() => updateIssueStatus(selectedIssue.id, 'ignored')}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      忽略此问题
                    </button>
                  )}
                  {selectedIssue.status === 'resolved' && (
                    <button
                      onClick={() => updateIssueStatus(selectedIssue.id, 'pending')}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      重新待处理
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  问题类型分布
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-24">
                          {ISSUE_TYPE_LABELS[type as IssueType]}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary-500 h-full rounded-full transition-all"
                            style={{ width: `${(count / stats.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
