import { useState, useMemo } from 'react'
import {
  Download, FileSpreadsheet, FileJson, FileText,
  Check, AlertTriangle, FileCode, BarChart3, Users,
  PieChart, ChevronRight, Eye
} from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { exportToExcel, exportToJson, exportReport, generateReviewReport } from '@/core/importExportEngine'
import type { ReviewReport } from '@/types'
import { ISSUE_TYPE_LABELS, type IssueType } from '@/types'

export function ExportWorkspace() {
  const { state } = useApp()
  const [exportFormat, setExportFormat] = useState<'excel' | 'json' | 'html'>('excel')
  const [includeItems, setIncludeItems] = useState(true)
  const [includeIssues, setIncludeIssues] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  const report = useMemo((): ReviewReport | null => {
    if (state.items.length === 0) return null
    return generateReviewReport(state.items, state.issues)
  }, [state.items, state.issues])

  const handleExport = () => {
    if (state.items.length === 0) {
      alert('没有可导出的数据')
      return
    }
    
    try {
      if (includeItems && includeIssues && report) {
        exportReport(report, state.items, exportFormat)
      } else if (includeItems) {
        const filename = `事项清单_${new Date().toISOString().slice(0, 10)}.${exportFormat === 'json' ? 'json' : 'xlsx'}`
        if (exportFormat === 'json') {
          exportToJson(state.items, filename)
        } else {
          exportToExcel(state.items, [], filename)
        }
      } else if (includeIssues && report) {
        const filename = `问题清单_${new Date().toISOString().slice(0, 10)}.${exportFormat === 'json' ? 'json' : 'xlsx'}`
        if (exportFormat === 'json') {
          exportToJson(state.items, filename)
        } else {
          exportToExcel([], state.issues, filename)
        }
      }
      
      alert('导出成功！')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    }
  }

  const departments = useMemo(() => {
    return [...new Set(state.items.map(i => i.department).filter(Boolean))]
  }, [state.items])

  const issuesByDepartment = useMemo(() => {
    return state.issues.reduce((acc, issue) => {
      const item = state.items.find(i => i.id === issue.itemId)
      const dept = item?.department || '未分类'
      acc[dept] = (acc[dept] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [state.items, state.issues])

  if (state.items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <Download className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-2">请先在导入区导入事项数据</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">导出审校结果</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                showPreview
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              {showPreview ? '隐藏预览' : '预览报告'}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">导出格式：</span>
            <div className="flex gap-2">
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  exportFormat === 'excel'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  exportFormat === 'json'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileJson className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => setExportFormat('html')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  exportFormat === 'html'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileCode className="w-4 h-4" />
                HTML报告
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeItems}
                onChange={e => setIncludeItems(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">包含事项清单</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeIssues}
                onChange={e => setIncludeIssues(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">包含问题清单</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showPreview && report ? (
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6">
                <h1 className="text-2xl font-bold">实施清单审校报告</h1>
                <p className="text-primary-200 mt-1">
                  生成时间：{new Date(report.createTime).toLocaleString()}
                </p>
              </div>

              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">审校概要</h3>
                  <p className="text-sm text-blue-700">{report.summary}</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <BarChart3 className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                    <div className="text-2xl font-bold text-gray-800">{report.totalItems}</div>
                    <div className="text-xs text-gray-500">事项总数</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                    <Check className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                    <div className="text-2xl font-bold text-blue-700">{report.reviewedItems}</div>
                    <div className="text-xs text-blue-600">已审校事项</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center border border-amber-200">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-amber-700">{report.totalIssues}</div>
                    <div className="text-xs text-amber-600">问题总数</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <Check className="w-6 h-6 mx-auto text-green-500 mb-2" />
                    <div className="text-2xl font-bold text-green-700">{report.resolvedIssues}</div>
                    <div className="text-xs text-green-600">已解决问题</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary-600" />
                    问题类型分布
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(report.issuesByType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-sm text-gray-700 flex-1">
                            {ISSUE_TYPE_LABELS[type as IssueType]}
                          </span>
                          <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-primary-500 h-full rounded-full"
                              style={{ width: `${(count / report.totalIssues) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-800 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    部门问题分布
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.issuesByDepartment)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dept, count]) => (
                        <div key={dept} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-sm text-gray-700 w-40">{dept}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${(count / report.totalIssues) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-800 w-8 text-right">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    问题详情（待处理）
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {report.details
                      .filter(i => i.status === 'pending')
                      .slice(0, 10)
                      .map(issue => (
                        <div key={issue.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-gray-800">{issue.itemName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              issue.severity === 'error' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {issue.severity === 'error' ? '严重' :
                               issue.severity === 'warning' ? '警告' : '提示'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded p-2">
                            <ChevronRight className="w-4 h-4" />
                            <span>{issue.suggestion}</span>
                          </div>
                        </div>
                      ))}
                    {report.details.filter(i => i.status === 'pending').length > 10 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        还有 {report.details.filter(i => i.status === 'pending').length - 10} 个待处理问题...
                      </div>
                    )}
                    {report.details.filter(i => i.status === 'pending').length === 0 && (
                      <div className="text-center text-sm text-green-600 py-4 bg-green-50 rounded-lg">
                        <Check className="w-8 h-8 mx-auto mb-2" />
                        所有问题已处理完毕！
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 bg-gray-50 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">导出概览</h3>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-3">事项清单</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>事项总数</span>
                    <span className="font-medium">{state.items.length} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span>涉及部门</span>
                    <span className="font-medium">{departments.length} 个</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">部门分布：</div>
                  <div className="flex flex-wrap gap-1">
                    {departments.map(dept => (
                      <span key={dept} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {dept} ({state.items.filter(i => i.department === dept).length})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-3">问题清单</h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>问题总数</span>
                    <span className="font-medium text-amber-600">{state.issues.length} 个</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已解决</span>
                    <span className="font-medium text-green-600">
                      {state.issues.filter(i => i.status === 'resolved').length} 个
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>待处理</span>
                    <span className="font-medium text-red-600">
                      {state.issues.filter(i => i.status === 'pending').length} 个
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">按部门分布：</div>
                  <div className="space-y-1">
                    {Object.entries(issuesByDepartment)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dept, count]) => (
                        <div key={dept} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-28 truncate">{dept}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${(count / state.issues.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-6">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  导出说明
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Excel 格式包含两个工作表：事项清单和问题清单</li>
                  <li>HTML 报告格式美观，适合打印和汇报</li>
                  <li>JSON 格式适合数据交换和二次处理</li>
                  <li>建议在导出前完成所有问题的复核和处理</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="w-80 border-l border-gray-200 bg-white overflow-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">事项清单</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {state.items.map(item => {
              const itemIssues = state.issues.filter(i => i.itemId === item.id)
              const pendingIssues = itemIssues.filter(i => i.status === 'pending')
              
              return (
                <div key={item.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                      {item.itemName}
                    </span>
                    {pendingIssues.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                        {pendingIssues.length} 待处理
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{item.department}</div>
                  {itemIssues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[...new Set(itemIssues.map(i => i.type))].slice(0, 3).map(type => (
                        <span
                          key={type}
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {ISSUE_TYPE_LABELS[type]}
                        </span>
                      ))}
                      {itemIssues.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                          +{itemIssues.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
